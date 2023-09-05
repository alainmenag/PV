// ==========================================================================
// NODE - SQUARE
// ==========================================================================

module.exports = function(modules, config) {
	
	var exports = {items: {}};
	
	exports.formatPrice = function(num, whole = false)
	{
		var v = (num || 0).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
		
		if (whole) v = parseInt(v.replace('.', ''));
		
		return v;
	};

	exports.catalog = async function(config, options)
	{
		var data_key = options.cid || options.key || modules.sha1(JSON.stringify(options));
		var data = await modules.redisClient.getAsync(data_key);
		
		var fetch = function(config, options, callback)
		{
			options.objects = options.objects || {};
			
			console.log(options);
		
			var access_token = options.access_token;
			var uri = options.host + '/v2/catalog/list';
			
			uri += '?t=1';
			
			if (options.cursor) uri += '&cursor=' + options.cursor;
			
			modules.request({
				uri: uri,
				method: 'GET',
				qs: {
					//types: 'ITEM',
					//version: options.version,
				},
				headers: {
					'Authorization': 'Bearer ' + access_token,
					'Content-Type': 'application/json'	
				},
				timeout: 3000
			}, function(e, r, body)
			{
				try {body = JSON.parse(body)} catch(err) {};

				if (body && body.objects) modules._.each(body.objects ? body.objects : body, function(item, i)
				{
					item.index = i;
					item._id = item.id;
					item.active = true;
					
					options.objects[item.id] = item;
				});
				
				if (body) options.cursor = body.cursor;
				
				if (options.cursor) return fetch(config, options, callback);
				
				var payload = {
					count: Object.values(options.objects).length,
					items: options.objects,
					ts: Date.now()
				};
				
				modules.redisClient.set(data_key, JSON.stringify(payload));
				
	
				callback(payload);
			});
		};
		
		return new Promise(resolve =>
		{
			if (data) return resolve(data);
			
			fetch(config, options, resolve);
		});
	};


/*
	
	exports.catalogObject2Item = function(id) {  
		return new Promise(resolve =>
		{
			modules['storage.node'].db.items.find({_id: id}).limit(1).exec(function (err, docs)
			{
				resolve(docs[0] || null);
			});
		});
	};

// ==========================================================================
// NODE - SQUARE - EXPORTS - LOCATION - FETCH
// ==========================================================================
	
	exports.location.fetch = function(options = {}, callback = function() {}) {
		
		options.objects = options.objects || {};
		
		var host = exports.config.host;
		var access_token = exports.config.access_token;
		var uri = host + '/v2/locations/' + exports.config.location_id;

		modules.request({
			uri: uri,
			method: 'GET',
			headers: {
				'Authorization': 'Bearer ' + access_token,
				'Content-Type': 'application/json'	
			},
			timeout: 3000
		}, function(e, r, body) {
			
			try {body = JSON.parse(body)} catch(err) {};
			
			callback(body && body.location ? body.location : null);

		});

	};
	
	//exports.location.fetch({});
*/



/*
	
// ==========================================================================
// NODE - SQUARE - EXPORTS - SYNC
// ==========================================================================

	exports.sync = function(options = {}, callback = function() {})
	{
		var res = {i: 0, errors: [], memos: []};
		var done = function()
		{
			res.i --; if (res.i) return;
			
			callback({
				error: res.errors.join('; ') || null,
				memo: res.memos.join('; ') || null
			});
		};
		
		modules['storage.node'].db.items.update({}, { // set all items to inactive
			$set: {active: false},
		}, {
			upsert: false,
			multi: true,
		}, function (err, r)
		{
			res.i ++; exports.items.fetch({}, function(r)
			{
				if (!r || !r.count)
				{
					res.errors.push('Unable to load site iems.'); return done();
				}
				
				res.memos.push('Synced "' + r.count + '" items.');
				
				//console.log(r.items);
				
				modules['storage.node'].write({
					path: '/configurations/items.json',
					content: JSON.stringify(r.items)
				}, done);
			});
		});
		
		res.i ++; exports.location.fetch({}, function(r)
		{
			if (!r || !r.id)
			{
				res.errors.push('Unable to load location.'); return done();
			}
			
			r.type = 'LOCATION';
			
			modules['storage.node'].write({
				path: '/configurations/locations.json',
				content: JSON.stringify([r])
			}, done);
		});
	};
	
	exports.sync();

// ==========================================================================
// NODE - SQUARE - EXPORTS - ORDER-2-TICKET
// ==========================================================================
	
	exports.item2entry = function(options = {}, callback = function() {})
	{
		var catalog = modules['storage.node'].read({
			path: '/configurations/items.json'
		});
		
		var r = {};
		var item = {};
		var items = Object.values(JSON.parse(catalog ? catalog : '{}'));

		for (let i = 0; i < items.length; i++)
		{
			if (items[i].item_data && items[i].item_data.name == options.name)
			{
				item = items[i]; break;
			}
		}
		
		if (!item.id) return r;
		
		r.id = item.id;
		r.variation = null;
		
		modules._.each(item.item_data.variations, function(v)
		{
			if (v.item_variation_data.name == options.variation_name)
			{
				r.variation = v.id;
			}	
		});
	
		return r;
	};
	
	exports.payment2ticket = function(options = {}, callback = function() {})
	{
		var tickets = modules['storage.node'].db.tickets;
		
		tickets.findOne({_id: options.reference_id}, function (err, doc)
		{
			if (err || !doc) return;
			
			var _payment = modules._.find(doc.payments, {id: options.terminal_checkout_id}) || modules._.find(doc.payments, {id: options.id});

			if (!_payment) return;
			
			Object.assign(_payment, options);
			
			try{_payment.amount = options.total_money.amount / 100} catch(err) {};

			modules['storage.node'].db.tickets.update({_id: doc._id}, {
				$set: doc,
			}, {
				upsert: true,
			}, function ()
			{});
			
			modules['socket.node'].io.to('127.0.0.1').emit('storage', {
				collection: 'tickets',
				content: doc
			});
		});
	};

// ==========================================================================
// NODE - SQUARE - EXPORTS - ORDER-2-TICKET
// ==========================================================================
	
	exports.order2ticket = function(options = {}, callback = function() {})
	{
		var tickets = modules['storage.node'].db.tickets;
		
		var host = exports.config.host;
		var access_token = exports.config.access_token;
		var uri = host + '/v2/orders/' + options.id;
		
		if (options.cursor) uri += '&cursor=' + options.cursor;

		modules.request({
			uri: uri,
			method: 'GET',
			headers: {
				'Authorization': 'Bearer ' + access_token,
				'Content-Type': 'application/json'	
			},
			timeout: 3000
		}, function(e, r, body)
		{
			try {body = JSON.parse(body)} catch(err) {};
			
			if (!body || !body.order) return;
			
			if (body.order.source.name != 'Square Online') return; // only for online orders for now
			
			var ts = Date.now();
			
			var s = {
				status: 'PAID',
				id: body.order.id,
				ref: body.order.id.slice(-4),
				updated: ts,
				ts: ts,
				items: [],
				method: 'ONLINE',
				due: 0,
				notes: [],
			};
			
			try {s.tip = body.order.total_tip_money.amount;} catch(err) {};
			
			//s.tip = 0;
			
			try {
				s.phone_number = body.order.fulfillments[0].pickup_details.recipient.phone_number;
				s.name = body.order.fulfillments[0].pickup_details.recipient.display_name;
			} catch(err) {};

			try { // set pickup as timestamp
				s.ts = parseInt(modules.moment(body.order.fulfillments[0].pickup_details.pickup_at).format('x'));
				s.notes.push(body.order.fulfillments[0].type + ' @ ' + modules.moment(body.order.fulfillments[0].pickup_details.pickup_at).format('hh:M A'));
			} catch(err) {s.ts = ts;};
			
			modules._.each(body.order.line_items, function(item) {
				
				var entry = exports.item2entry(item);
				
				entry.uuid = item.uid;
				entry.qty = parseInt(item.quantity);
				entry.amount = 0;
				entry.modifiers = {};
				entry.notes = [];
				
				modules._.each(item.modifiers, function(modifier)
				{
					entry.notes.push(modifier.name);
				});
				
				entry.notes = entry.notes.join(', ');
				
				s.items.push(entry);
			});
			
			s.notes = s.notes.join(', ');
			
			tickets.update({_id: body.order.id}, {
				$set: s,
			}, {
				upsert: true,
			}, function ()
			{
				tickets.findOne({_id: body.order.id}, function (err, doc)
				{
					modules['socket.node'].io.to('127.0.0.1').emit('storage', {
						collection: 'tickets',
						content: doc
					});
				
					modules['socket.node'].io.to('127.0.0.1').emit('notifications', {
						memo: 'New online order.',
						ticket: body.order.id
					});
				});
			});
		});
	};
	
	//exports.order2ticket({"type":"order","id":"SXlqYth8Y6bb8bwIjJl0RqWMZ2aZY","object":{"order_created":{"created_at":"2022-10-23T00:25:30.860Z","location_id":"4Q9DSKZZVRD16","order_id":"SXlqYth8Y6bb8bwIjJl0RqWMZ2aZY","state":"OPEN","version":1}}});

// ==========================================================================
// NODE - SQUARE - API ENDPOINTS
// ==========================================================================

	modules.exp.get('/api/square/sync', function(req, res)
	{
		exports.sync({}, function(r)
		{
			res.send(r);
		});
	});

	modules.exp.use('/api/square/event', function(req, res)
	{
		res.end();
		
		if (req.body.type == 'order.created') return exports.order2ticket(req.body.data);
		
		if (req.body.type == 'payment.updated') try {
			return exports.payment2ticket(req.body.data.object.payment);
		} catch(err) {};
		
		if (req.body.type == 'catalog.version.updated') try {
			return exports.items.fetch({}, function(r) {console.log('Square catalog synced:', JSON.stringify(r))});
		} catch(err) {};
		
		if (req.body.type == 'location.updated') try {
			return exports.sync({}, function(r) {console.log('Square location synced:', JSON.stringify(r.count));});
		} catch(err) {};
		
		console.log(Date.now(), '/api/square/event');
		console.log(req.body.type, JSON.stringify(req.body));

	});
	
	modules.exp.post('/api/square/process', function(req, res)
	{
		var host = exports.config.host;
		var access_token = exports.config.access_token;
		var uri = host + '/v2/terminals/checkouts';
		var checkout = {
			//"deadline_duration": "P0DT0H0M5S",
			"device_options": {
				"collect_signature": true,
				"skip_receipt_screen": true,
				"tip_settings": {
					"allow_tipping": false,
					"custom_tip_field": false,
					"separate_tip_screen": false,
					"smart_tipping": false
				},
				//"device_id": "146CS134A2000469", // main
				//"device_id": "DEVICE_INSTALLATION_ID:9C86A688-07F7-40C4-B1D1-401597B6BC29", // ipad
				//"device_id": "DEVICE_INSTALLATION_ID:08904AE8-06E1-4026-A061-AD7F70EE5EAC", // iphone
				//"device_id": "DEVICE_INSTALLATION_ID:08904AE8-06E1-4026-A061-AD7F70EE5EAC", // test retail dev.
				"device_id": "236CS149B1004145", // mobile device
			},
			"payment_options": {
				"accept_partial_authorization": false,
				"autocomplete": true
			},
			"payment_type": "CARD_PRESENT",
			//"payment_type": "MANUAL_CARD_ENTRY",
			"amount_money": {
				//"amount": req.body.ticket.total,
				"amount": exports.formatPrice(req.body.ticket.card.due / 100, true),
				"currency": "USD"
			},
			"reference_id": req.body.ticket.id
		};
		
		//return res.send();
		
		if (!req.body.ticket.tip) checkout.device_options.tip_settings = {
			"allow_tipping": true,
			"custom_tip_field": true,
			"separate_tip_screen": true,
			"smart_tipping": false
		};
		
		modules.request({
			uri: uri,
			method: 'POST',
			qs: {},
			json: {
				"checkout": checkout,
				"idempotency_key": req.body.payment.id
			},
			headers: {
				'Authorization': 'Bearer ' + access_token,
				'Content-Type': 'application/json',
				'Square-Version': '2022-09-21'
			},
			timeout: 3000
		}, function(e, r, body)
		{
			body = body || {};
			
			console.log(Date.now(), '/api/square/process');
			console.log(JSON.stringify(body));

			var memo = 'Unable to generate a checkout.';
			
			var m = modules._.find(req.body.ticket.payments, {
				id: req.body.payment.id
			}) || {};
			
			if (body.errors)
			{
				memo = body.errors[0].detail;
				m.status = 'ERROR';
			}
			
			if (body.checkout)
			{
				memo = body.checkout.status;
				m.status = body.checkout.status;
				m.id = body.checkout.id;
				//m.id = 'B2CgSQavkAdqO';
			}
			
			req.body.ticket.status = 'PAYING';
			
			modules['storage.node'].db.tickets.update({_id: req.body.ticket.id}, {
				$set: req.body.ticket,
			}, {
				upsert: true,
			}, function ()
			{});
			
			modules['socket.node'].io.to('127.0.0.1').emit('storage', {
				collection: 'tickets',
				content: req.body.ticket
			});

			res.send({memo: memo});
		});
	});
	
	modules.exp.post('/api/square/process/cancel', function(req, res)
	{
		var host = exports.config.host;
		var access_token = exports.config.access_token;
		var uri = host + '/v2/terminals/checkouts/' + (req.query.id || req.body.id) + '/cancel';
		
		modules.request({
			uri: uri,
			method: 'POST',
			qs: {},
			json: {},
			headers: {
				'Authorization': 'Bearer ' + access_token,
				'Content-Type': 'application/json',
				'Square-Version': '2022-09-21'
			},
			timeout: 3000
		}, function(e, r, body)
		{
			body = body || {};
			
			console.log(Date.now(), '/api/square/process/cancel');
			console.log(JSON.stringify(body));

			res.send({});
		});
	});
*/

// ==========================================================================
// NODE - SQUARE - EXPORTS
// ==========================================================================

	return exports;
};
