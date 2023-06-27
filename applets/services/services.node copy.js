
// ==========================================================================
// NODE - SERVICES
// ==========================================================================

module.exports = function(modules, config) {
				
	var exports = {};

// ==========================================================================
// NODE - SERVICES - LIST
// ==========================================================================
	
	exports.list = async function(options, data)
	{
		return new Promise(resolve =>
		{
			
			modules.mongo.profiles.find({category: 'services'}, function(err, docs)
			{
			
				resolve(docs);
			
			});
			
			
		
/*
			resolve([{
				"_id": "6486efa055bedc996a215d36",
				"active": true,
				"title": "Extensions",
				"description": "Talk or message with your colleagues from any PC, Mac, Andorid, iOS or web-enabled device.",
				"bullets": [
					"Talk & Message",
					"Extension Dialing",
					"Voicemail",
					"Group Paging"
				],
				"toggle": "/templates/service-toggle.html",
				"price": "$0.00/mo"
			}]);
*/
		
		});
	};

// ==========================================================================
// NODE - SERVICES - HTTP - TOGGLE
// ==========================================================================

	modules.exp.post('/api/services', function(req, res)
	{
		var ts = Date.now();
		var data = {};
		var done = function(r = {})
		{
			return res.send(r);
		};
		
		if (!req.body.uid) return done({});
		if (!req.body.action) return done({});
		if (!req.body.service) return done({});
		
		var serviceid = req.body.service;
		var userservices = req.session && req.session.profile && req.session.profile.services;
		
		var q = {category: 'services', $or: [
			{_id: new modules.mongodb.ObjectId(serviceid)} // always get given service
		]};
		
		// pull services that use the given service
		if (req.body.action == 'remove') q['$or'].push({
			services: serviceid
		});
		
		// pull other services that use the service being removed
		modules.mongo.profiles.find(q, function(err, docs)
		{
			var match = null;
			var dependents = [];
			
			// identify what's what on first loop
			for (let i = 0; i < docs.length; i++)
			{
				var s = docs[i];
				
				match = s._id == serviceid ? s : match;
				
				if (s._id != serviceid) dependents.push(s);
			}
			
			if(!match) return done({memo: 'Failed to pull service.'});
			
			// ensure dependents are not active first
			if (req.body.action == 'remove' && dependents.length)
			{
				var dependent = null;
				
				for (let i = 0; i < dependents.length; i++)
				{
					var s = dependents[i];
					
					if (userservices[s._id] && userservices[s._id].added)
					{
						dependent = s; continue; break;
					}
				}
				
				if (dependent) return done({
					err: 'Your "' + dependent.title + '" service depends on this service.'
				});
			}
			
			// mark given service as removed
			if (req.body.action == 'remove')
			{
				data['services.' + req.body.service + '.added'] = null;
				data['services.' + req.body.service + '.removed'] = ts;
			}
			
			// mark given service as added
			if (req.body.action == 'add')
			{
				data['services.' + req.body.service + '.added'] = ts;
				data['services.' + req.body.service + '.removed'] = null;
			}
			
			// mark given service dependents as added
			if (req.body.action == 'add' && match.services)
			{
				for (let i = 0; i < match.services.length; i++)
				{
					data['services.' + match.services[i] + '.added'] = ts;
					data['services.' + match.services[i] + '.removed'] = null;
				}
			}
			
			modules['profiles.node'].modify(req.body.uid, data, function(r)
			{
				if (r._id) req.session.profile = r;
				
				done({payload: r});
			});
		});
	});

// ==========================================================================
// NODE - SERVICES - EXPORTS
// ==========================================================================

	return exports;
};
