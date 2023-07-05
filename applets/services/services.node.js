
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

	exports.set = async function(req, res, next)
	{
		var ts = Date.now();
		var data = {};
		var done = function(r = {})
		{
			return res.send(r);
		};
		
		if (!req.body._id) return done({}); // service in profile being modified
		if (!req.body.action) return done({});
		if (!req.body.uid) return done({}); // profile being modified
		if (!req.body.category) return done({}); // type of service in profile that's being modified
			
		var _id = req.body._id;
		var category = req.body.category;
		
		var current = await modules['profiles.node'].grab({_id: _id});
		
		//console.log('/applets/services/services.node.js:', req.body); return done({});
		//var current = req.session && req.session.profile && req.session.profile[category];

		var q = {category: category, $or: [
			{_id: new modules.mongodb.ObjectId(_id)} // always get given document
		]};
		
		// pull services that use the given service
		if (req.body.action == 'remove')
		{
			var $or = {};
			
			$or[category] = _id; // categories key as array in other docs
			
			q['$or'].push($or);
		}

		// pull other services that use the service being removed
		modules.mongo.profiles.find(q, function(err, docs)
		{
			var match = null;
			var dependents = [];
			
			// identify what's what on first loop
			for (let i = 0; i < docs.length; i++)
			{
				var s = docs[i];
				
				match = s._id == _id ? s : match;
				
				if (s._id != _id) dependents.push(s);
			}
			
			if(!match) return done({memo: 'Failed to pull service.'});
			
			// ensure dependents are not active first
			if (req.body.action == 'remove' && dependents.length)
			{
				var dependent = null;
				
				for (let i = 0; i < dependents.length; i++)
				{
					var s = dependents[i];
					
					if (current[s._id] && current[s._id].added)
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
				data[category + '.' + _id + '.added'] = null;
				data[category + '.' + _id + '.removed'] = ts;
			}
			
			// mark given service as added
			if (req.body.action == 'add')
			{
				data[category + '.' + _id + '.added'] = ts;
				data[category + '.' + _id + '.removed'] = null;
			}
			
			// mark given service dependents as added
			if (req.body.action == 'add' && match.services)
			{
				for (let i = 0; i < match.services.length; i++)
				{
					data[category + '.' + match.services[i] + '.added'] = ts;
					data[category + '.' + match.services[i] + '.removed'] = null;
				}
			}

			modules['profiles.node'].modify(req.body.uid, data, function(r)
			{
				//if (r._id) req.session.profile = r;
				
				done({payload: r});
			});
		});

	};

	modules.exp.post('/api/services', exports.set);

// ==========================================================================
// NODE - SERVICES - EXPORTS
// ==========================================================================

	return exports;
};
