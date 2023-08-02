
// ==========================================================================
// NODE - ORYK
// ==========================================================================

module.exports = function(modules, config) {
				
	var exports = {
		domain: 'oryk.com',
		sip: {},
		queues: {},
		xmpp: {}
	};
	
	exports.sip.db = new modules.pg.Client({
		host: (config.postgres && config.postgres.host ? config.postgres.host : '0.0.0.0'),
		user: config?.postgres?.user,
		password: config?.postgres?.password,
		database: 'freeswitch',
	});
	
	exports.sip.db.connect((err) =>
	{
		console.log('***** ORYK: sip: db:', err);
	});
	
	exports.xmpp.db = new modules.pg.Client({
		host: (config.postgres && config.postgres.host ? config.postgres.host : '0.0.0.0'),
		user: config?.postgres?.user,
		password: config?.postgres?.password,
		database: 'prosody',
	});
	
	exports.xmpp.db.connect((err) =>
	{
		console.log('***** ORYK: xmpp: db:', err);
	});

// ==========================================================================
// NODE - ORYK - EXPORTS - PROVISION
// ==========================================================================
	
	exports.provision = function(options = {})
	{
		if (!options._id) return;
		
		// setup a queue for a department
		if (options.category == 'departments')
		{
			exports.sip.provision(options);
			
			exports.queues.setup(options);
			exports.queues.provision(options);
		}
		
		// when a user's profile is modified
		if (['users', 'bots'].indexOf(options.category) > -1) modules.mongo.profiles.findOne({
			_id: options._id
		}, function(err, profile)
		{
			if (!profile) return;
			
			var services = profile.services || {};
			
			var extensions = services['6486efa055bedc996a215d36'] && services['6486efa055bedc996a215d36'].added; // user uses extensions
			var queues = services['64891ebf55bedc996a21d632'] && services['64891ebf55bedc996a21d632'].added; // user uses queues & departments
			
			if (profile.deactivated) [extensions = null, queues = null]; // remove all traces
			
			if (extensions) {
				exports.sip.provision(profile);
				exports.xmpp.provision(profile);
			} else {
				exports.sip.deprovision(profile);
				exports.xmpp.deprovision(profile);
			}
			
			if (queues) {
				exports.queues.provision(profile);
			} else {
				exports.queues.deprovision(profile);
			}
		});
	};

// ==========================================================================
// NODE - ORYK - EXPORTS - SIP - PROVISION
// ==========================================================================
	
	exports.sip.provision = async function(profile)
	{
		var done = function()
		{
			
		};
		
		modules.request({
			url: 'http://sip.oryk.com/api/jsapi/?oryk.js',
			body: JSON.stringify(profile),
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		}, function(error, response, body) {});
		
		// ensure domain is synced
		try {
			var res = await exports.sip.db.query("INSERT INTO domains (name) VALUES('" + exports.domain + "');");
		} catch(err) {};
		
		// get domain index
		var res = await exports.sip.db.query("SELECT id FROM domains WHERE name = '" + exports.domain + "'");
		var domainidx = (res.rows && res.rows[0] && res.rows[0].id);
		
		if (!domainidx) return done({err: 'Unable to provision domain: ' + exports.domain});

		var password = modules.md5([
			profile._id,
			exports.domain,
			profile.password || Date.now().toString()
		].join(':'));

		// ensure user
		try {
			var res = await exports.sip.db.query("INSERT INTO users (domain, name, password) VALUES('" + domainidx + "', '" + profile._id + "', '" + password + "');");
		} catch(err) {};
		
		// get sip user
		var res = await exports.sip.db.query("SELECT * FROM users WHERE domain = '" + domainidx + "' AND users.name = '" + profile._id + "';");
		var sipuser = (res.rows && res.rows[0] && res.rows[0]);
		
		if (!sipuser) return done({err: 'Unable to provision user: ' + profile._id});
		
		// add extension
		try {
			var res = await exports.sip.db.query("INSERT INTO extensions (\"domain\", toll_allow, user_context, \"user\") VALUES(" + domainidx + ", 'local', 'default', " + sipuser.id + ");");
		} catch(err) {};
		
		// get extension
		var res = await exports.sip.db.query("SELECT * FROM extensions WHERE \"user\" = " + sipuser.id);
		var extension = (res.rows && res.rows[0] && res.rows[0]);
		
		sipuser.blocked = profile.blocked || 0;
		sipuser.extension = extension.id;
		sipuser.password = password;
		
		var res = await exports.sip.db.query("UPDATE users SET \"password\"='" + password + "', \"extension\"=" + sipuser.extension + ", \"blocked\"=" + sipuser.blocked + " WHERE id=" + sipuser.id);
	};

// ==========================================================================
// NODE - ORYK - EXPORTS - SIP - DEPROVISION
// ==========================================================================
	
	exports.sip.deprovision = async function(profile)
	{
		// get domain index
		var res = await exports.sip.db.query("SELECT id FROM domains WHERE name = '" + exports.domain + "'");
		var domainidx = (res.rows && res.rows[0] && res.rows[0].id);
		
		if (!domainidx) return;
		
		// get sip user
		var res = await exports.sip.db.query("SELECT * FROM users WHERE domain = '" + domainidx + "' AND users.name = '" + profile._id + "';");
		var sipuser = (res.rows && res.rows[0] && res.rows[0]);
		
		if (!sipuser) return;
		
		await exports.sip.db.query("DELETE FROM extensions WHERE id=" + sipuser.extension + ";");
		await exports.sip.db.query("DELETE FROM users WHERE id=" + sipuser.id + ";");
	};

// ==========================================================================
// NODE - ORYK - EXPORTS - XMPP - PROVISION
// ==========================================================================
	
	exports.queues.setup = async function(options)
	{
		modules.mongo.profiles.findOne({
			_id: options._id,
			category: 'departments'
		}, function(err, profile)
		{
/*
			if (profile) modules.request({
				//url: 'https://bin.wimzel.com/80b081f8-7523-432f-818d-5d669505f7bc-1665364940015',
				url: 'http://sip.oryk.com/api/jsapi/?oryk.js',
				body: JSON.stringify(profile),
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			}, function(error, response, body) {});
*/
			
			
			//http://sip.oryk.com/api/lua/?oryk.lua
			//http://sip.oryk.com/api/jsapi/?oryk.js
			
			//{"_id":"648afad955bedc996a22540b","id":"tudays.catering","category":"departments","title":"Tudays (Catering)","active":true,"created":1686829785699,"owners":["6488a58a5ac61a2ae3a2c14d"],"pin":233424,"updated":1688303094110,"members":["64889edb5ac61a2ae3a2c14a","6488c5afe6a8bb2ee6cdc145"],"description":"Place an order for any event.","queue":{"abandoned-resume-allowed":1,"discard-abandoned-after":60,"max-wait-time":null,"max-wait-time-with-no-agent":1,"max-wait-time-with-no-agent-time-reached":1,"skip-agents-with-external-calls":null,"strategy":"ring-all","tier-rule-no-agent-no-wait":null,"tier-rule-wait-multiply-level":1,"tier-rule-wait-second":300,"tier-rules-apply":null,"time-base-score":"system"},"greetings":{"greeting":{"file":null,"text":"Thank you for calling Tudays catering line. Let me try to connect you."},"hold":{"file":null,"text":null},"moh":{"file":"https://main.us-east-1.linodeobjects.com/648afad955bedc996a22540b_greetings.moh.file?ts=1688303043678"},"ringback":{"file":null},"voicemail":{"file":null,"text":null}}}
			
			
		
		});
	};
	
	exports.queues.provision = async function(profile)
	{
		var sipaddr = profile._id + '@' + exports.domain;

		try {
			var res = await exports.sip.db.query("INSERT INTO agents (\"name\", instance_id, uuid, \"type\", contact, status, state, max_no_answer, wrap_up_time, reject_delay_time, busy_delay_time, no_answer_delay_time, last_bridge_start, last_bridge_end, last_offered_call, last_status_change, no_answer_count, calls_answered, talk_time, ready_time, external_calls_count) VALUES('" + sipaddr + "', 'single_box', '', 'callback', '[leg_timeout=10]user/" + sipaddr + "', 'Logged Out', 'Waiting', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);");
		} catch(err) {};
		
		for (const name in profile.departments)
		{
			var o = profile.departments[name];
			
				await exports.sip.db.query("DELETE FROM tiers WHERE agent='" + sipaddr + "';");
			
			if (o.added) try
			{
				exports.queues.setup({_id: (new modules.mongodb.ObjectId(name))});
				
				await exports.sip.db.query("INSERT INTO tiers (queue, agent, state, \"level\", \"position\") VALUES('" + (name + '@' + exports.domain) + "', '" + sipaddr + "', 'Ready', 1, 1);");
			} catch(err) {};
			
/*
			if (o.removed) try
			{
				await exports.sip.db.query("DELETE FROM tiers WHERE queue='" + (name + '@' + exports.domain) + "' AND agent='" + sipaddr + "';");
			} catch(err) {};
*/
			
		}
	};
	
	exports.queues.deprovision = async function(profile)
	{
		var sipaddr = profile._id + '@' + exports.domain;
		
		try {
			await exports.sip.db.query("DELETE FROM agents WHERE name='" + sipaddr + "';");
		} catch(err) {};
		
		try {
			await exports.sip.db.query("DELETE FROM tiers WHERE agent='" + sipaddr + "';");
		} catch(err) {};
	};

// ==========================================================================
// NODE - ORYK - EXPORTS - XMPP - PROVISION
// ==========================================================================
	
	exports.xmpp.provision = async function(profile)
	{
		if (!profile || !profile._id || !profile.password) return;
		
		var uid = profile._id.toString();
		var jid = uid + '@' + exports.domain;

		// ensure user
		try {
			var res = await exports.xmpp.db.query("INSERT INTO prosody (\"host\", \"user\", \"store\", \"key\", \"type\", \"value\") VALUES('" + exports.domain + "', '" + uid + "', 'accounts', 'password', 'string', '" + profile.password + "');");
		} catch(err) {};

		// ensure password
		try {
			var res = await exports.xmpp.db.query("UPDATE prosody SET value='" + profile.password + "' WHERE host='" + exports.domain + "' AND \"user\"='" + uid + "'");
		} catch(err) {};
		
		//var res = await exports.sip.db.query("UPDATE users SET \"password\"='" + password + "', \"extension\"=" + sipuser.extension + ", \"blocked\"=" + sipuser.blocked + " WHERE id=" + sipuser.id);
		
/*
NOTICE:  relation "prosody" already exists, skipping
NOTICE:  relation "prosody_index" already exists, skipping
NOTICE:  relation "prosodyarchive" already exists, skipping
NOTICE:  relation "prosodyarchive_index" already exists, skipping
NOTICE:  relation "prosodyarchive_with_when" already exists, skipping
NOTICE:  relation "prosodyarchive_when" already exists, skipping
NOTICE:  relation "prosodyarchive_sort" already exists, skipping
*/
		
/*
prosodyctl deluser assistant@oryk.com


prosodyctl adduser 6488a58a5ac61a2ae3a2c14d@oryk.com
*/
		
	};
	
	exports.xmpp.deprovision = async function(profile)
	{
		
	};
	
	
	
	
	
	
	
	exports.queues.list = async function(payload, data)
	{
		return new Promise(resolve =>
		{
			var uid = null; try {
				uid = payload.session.profile._id.toString();
			} catch(err) {};
			
			if (payload.params._id) uid = payload.params._id;
			
			if (!uid) return resolve([]);
			
			modules.mongo.profiles.find({
				"category": "departments",
				"deleted": null,
				"$or": [{"owners": uid}, {"members": uid}]
			}, function(err, docs)
			{
				resolve(docs);
			});
		});
	}
	
	
/* be able to join

648af7dc55bedc996a2252b7
7108@tudays.com
710809

*/
	
	modules.exp.post('/api/services/departments', function(req, res)
	{
		var ts = Date.now();
		var owners = (req.session.profile.owners || []).join(',').split(','); owners.push(req.session.uid); // user owners
		
		req.body.pin = parseInt(req.body.pin) || null;
		
		var query = {
			category: 'departments',
			'pin': req.body.pin,
			'owners': {'$in': owners}
		};

		modules.mongo.profiles.findOne(query, function (err, doc)
		{
			// if exists within owner chain path
			if (doc) return (function()
			{
				if (doc?.members?.indexOf(req.session.uid) > -1) return res.send(doc);
				
				modules.mongo.profiles.findAndModify({
					query: {_id: doc._id},
					update: {$push: {members: req.session.uid}},
					upsert: false,
					new: true
				}, function (err, doc, lastErrorObject)
				{
					res.send(doc);
				});
			})();
			
			var _id = new modules.mongodb.ObjectId();
		
			return modules.mongo.profiles.findAndModify({
				query: {
					_id: new modules.mongodb.ObjectId()
				},
				update: {$set: {
					"id": _id.toString(),
				    "owners" : [req.session.uid],
				    "category" : "departments",
				    "title" : req.body.name,
				    "pin" : req.body.pin,
				    "created" : ts,
				    "updated" : ts,
				    "active" : true
				}},
				upsert: true,
				new: true
			}, function (err, doc, lastErrorObject)
			{
				res.send(doc);
				
				if (doc) exports.queues.setup(doc);	
			});
			
			res.send({});
		});
		
		
		
		
		
		
/*
		var profile = {
		    "owners" : [req.body.uid],
		    "category" : "departments",
		    "title" : req.body.name,
		    "pin" : req.body.pin ? parseInt(req.body.pin) : null,
		    "created" : ts,
		    "updated" : ts,
		    "active" : true
		};
		
		var query = {category: 'departments', 'title': req.body.name};

		modules.mongo.profiles.findOne(query, function (err, doc)
		{
			
			modules.mongo.profiles.findAndModify({
				query: query,
				update: {$set: profile},
				upsert: doc ? false : true,
				new: true
			}, function (err, doc, lastErrorObject)
			{
				if (!doc && !err) err = 'Update failed.';
				
				console.log(err, doc);
				
				res.send({});
			});
			
		});
*/

	});

// ==========================================================================
// NODE - ORYK - EXPORTS
// ==========================================================================

	return exports;
};

/*
	modules.exp.use('/api/events', function(req, res, next)
	{
		
		console.log(req.headers);
		console.log(req.query);
		console.log(JSON.stringify(req.body));
	
	
		res.send('TEST');
	
	
	
	});
*/
