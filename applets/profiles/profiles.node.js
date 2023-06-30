
// ==========================================================================
// NODE - ACCESS
// ==========================================================================

module.exports = function(modules, config)
{
	var exports = {};
	
	exports.get = function(payload, options) {
		return new Promise(resolve =>
		{
			var _id = payload.params._id; try {
				_id = new modules.mongodb.ObjectId(payload.params._id);
			} catch(err) {};
			
			if (!_id) return resolve();
			
			var q = {$or: [
				{id: payload.params._id},
				{_id: _id}
			]};
			
			/*
			var owners = [];
				
			query['category'] = options.category;
			query['$and'] = [];
			
			if (options.uid) query['$and'].push({'$or': [
				{'_id': new modules.mongodb.ObjectId(options.uid)},
				{'owners': options.uid}
			]});
			*/
		
			modules.mongo.profiles.findOne(q, function(err, profile)
			{
				if (!profile) return resolve();

				var owners = profile.owners || [];
				
				owners.push(profile._id.toString());
				
				profile.readOnly = true;
				
				if (payload.session.uid && owners.indexOf(payload.session.uid) > -1)
				{
					profile.readOnly = false;
				}
				
				if (profile.readOnly)
				{
					delete profile.password;
					delete profile.secure;
					delete profile.access_token;
					delete profile.aliases;
				}
				
				resolve(profile);
			});
		});
	};
	
	exports.create = async function(username, profile, callback = function() {})
	{
		if (profile.password) profile.password = (await modules['access.node'].encode(profile.password));

		return new Promise(resolve =>
		{
			var done = function(r) {callback(r); resolve(r);};
			var ts = Date.now();
			var query = {category: 'users'};
			
			query['aliases.' + modules.btoa(username)] = {$exists: true};
			
			profile.created = ts;
			profile.updated = ts;
			profile.category = 'users';
			profile.aliases = {};
			
			profile.aliases[modules.btoa(username)] = {created: ts, alias: username};
			
			if (profile.password)
			{
				profile.aliases[modules.btoa(username)]['strategy'] = 'local';
				profile.aliases[modules.btoa(username)]['access_token'] = profile.password;	
			}

			modules.mongo.profiles.findOne(query, function(err, p)
			{
				if (p) return done({err: 'Try again with a different username.'}); // avoid creating for same account

				modules.mongo.profiles.insertOne(profile, function (err, doc)
				{
					done(err || !doc ? {err: (err || 'Failed to create.')} : doc);
				
					if (doc) modules.pubSub.emit('profiles', doc);
				});
			});
		});
	};
	
	exports.modify = async function(id, profile, callback = function() {})
	{
		if (profile.password) profile.password = (await modules['access.node'].encode(profile.password));
		
		return new Promise(resolve =>
		{
			var ts = Date.now();
			var _id = new modules.mongodb.ObjectId(id);
			var query = {_id: _id};
			var done = function(r)
			{
				callback(r); resolve(r);
			};
			
			if (profile.access_token) query['password'] = profile.access_token;
			
			delete profile.uid;
			delete profile.access_token;
			
			profile.updated = ts;
			
			if (profile.incognito != undefined)
			{
				profile.incognito = parseInt(profile.incognito) || 0;
			}

			modules.mongo.profiles.findAndModify({
				query: query,
				update: {$set: profile},
				//upsert: true,
				new: true
			}, function (err, doc, lastErrorObject)
			{
				if (!doc && !err) err = 'Update failed.';
				
				done(err ? {err : err} : doc);
				
				if (doc) modules.pubSub.emit('profiles', doc);
			});
		});
	};

	modules.exp.post('/api/profiles', function(req, res)
	{
		req.body.access_token = req.body.access_token || '!'; // require an access token over http
		
		exports.modify(req.body.uid, req.body, function(r)
		{
			if (r._id) req.session.profile = r;
			
			res.send(r._id ? {payload: r} : r);
		});	
	});

	modules.exp.get('/api/profiles', function(req, res)
	{
		var query = {_id: null};
		var uid = req.query.uid;
		var access_token = null;
		
		if (req.session.passport) try {
			uid = uid || req.session.passport.user.uid;
			access_token = req.session.profile.password;
		} catch(err) {};
		
		try {query._id = new modules.mongodb.ObjectId(uid);} catch(err) {};
		
		if (!query._id) return res.send();
		
		query.password = access_token;

		modules.mongo.profiles.findOne(query, function(err, profile)
		{
			res.send(profile);
		});
	});

// ==========================================================================
// NODE - ACCESS - EXPORTS
// ==========================================================================

	return exports;
};




/*
db.getCollection('profiles').aggregate([
  {
    $match: {
      "category": "users"
    }
  },
  {
    $addFields: {
      aliasArray: { $objectToArray: "$aliases" }
    }
  },
  {
    $match: {
      "aliasArray.k": "sebastian@oryk.com"
    }
  }
])
*/
