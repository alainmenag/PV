// ==========================================================================
// NODE - SQUARE
// ==========================================================================

module.exports = function(modules, config) {
	
	var exports = {items: {}};
	
// ==========================================================================
// NODE - SQUARE - FORMAT PRICE
// ==========================================================================
	
	exports.formatPrice = function(num, whole = false)
	{
/*
		var v = (parseFloat(num) || 0).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
		
		if (whole) v = parseFloat(v.replace('.', ''));
		
		return parseFloat(v) || 0;
*/

		// Parse a string to a floating-point number
		var str = (num || 0).toString();
		var num = parseFloat(str);
		
		// Round the number to two decimal places
		var roundedNum = num.toFixed(0);
		
		return parseInt(roundedNum);
	};
	
// ==========================================================================
// NODE - SQUARE - CATALOG
// ==========================================================================

	exports.catalog = async function(config, options)
	{
		var data_key = options.cid || options.key || modules.sha1(JSON.stringify(options));
		var data = await modules.redisClient.getAsync(data_key);
		
		var fetch = function(config, options, callback)
		{
			options.objects = options.objects || {};
		
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
	



// ==========================================================================
// NODE - SQUARE - PROCESS
// ==========================================================================

	modules.exp.post('/api/square/process', function(req, res)
	{
		if (!config.square) return res.send({
			memo: 'No configuration was mached for this process.'
		});
		
		var host = config.square.host;
		var access_token = config.square.access_token;
		var uri = host + '/v2/terminals/checkouts';
		
		// cancel with conf. #
		if (req.body.confirmation) return (function()
		{
			var uri = host + '/v2/terminals/checkouts/' + req.body.confirmation + '/cancel';
			
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
				res.send({
					"location": "/checkout",
					"payment": req.body.payment,
					"confirmation": null,
					"reference": req.body.reference,
					"notify": (body?.checkout?.cancel_reason || body?.checkout?.status || 'INFO') + ': ' + (body.errors ? (body.errors[0].detail) : "Tap or dip to pay.")
				});
			});
		})();
		
		var checkout = {
			"device_options": {
				"collect_signature": true,
				"skip_receipt_screen": true,
				"tip_settings": {
					"allow_tipping": true,
					"custom_tip_field": true,
					"separate_tip_screen": true,
					"smart_tipping": false
				},
				"device_id": config.square.device_id,
			},
			"payment_options": {
				"accept_partial_authorization": false,
				"autocomplete": true
			},
			"payment_type": "CARD_PRESENT",
			"amount_money": {
				"amount": exports.formatPrice(req.body.amount),
				"currency": "USD"
			},
			"reference_id": req.body.reference
		};

		modules.request({
			uri: uri,
			method: 'POST',
			qs: {},
			json: {
				"checkout": checkout,
				"idempotency_key": req.body.reference
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
			
			res.send({
				"location": "/checkout",
				"payment": req.body.payment,
				"confirmation": body?.checkout?.id,
				"reference": req.body.reference,
				"notify": (body?.checkout?.cancel_reason || body?.checkout?.status || 'INFO') + ': ' + (body.errors ? (body.errors[0].detail) : "Tap or dip to pay.")
			});
		});
	});

// ==========================================================================
// NODE - SQUARE - PROCESS
// ==========================================================================

/*
	modules.exp.post('/api/square/checkout', function(req, res)
	{
		if (!config.square) return res.send({
			memo: 'No configuration was mached for this process.'
		});
		
		var host = config.square.host;
		var access_token = config.square.access_token;
		var uri = host + '/v2/online-checkout/payment-links';
		
		var checkout = {
			"description": "Checkout",
			"idempotency_key": modules.uuid(),
			"order": {
				"location_id": config.square.location_id,
				"line_items": [{
					"quantity": "1",
					"base_price_money": {
						"amount": exports.formatPrice(req.body.amount),
						"currency": "USD"
					},
					"name": "Items"
				}],
				"pricing_options": {
			        "auto_apply_taxes": true
			      },
				"service_charges": [
				
					{
						"calculation_phase": "TOTAL_PHASE",
						//"calculation_phase": "SUBTOTAL_PHASE",
						"percentage": (req.body.fee_interchange || 0).toString(),
						"name": "Card Proccessing Interchange Fee (" + (req.body.fee_interchange || 0) + "%)"
					},
					{
						"calculation_phase": "TOTAL_PHASE",
						//"calculation_phase": "SUBTOTAL_PHASE",
						"amount_money": {
							"amount": parseInt(req.body.fee_processing) || 0,
							"currency": "USD"
						},
						"name": "Square Transaction Fee"
					}
					
				]
			},
			"checkout_options": {
				"allow_tipping": false,
				"enable_coupon": false,
				"enable_loyalty": true,
				"redirect_url": req.body.redirect,
				"accepted_payment_methods": {
					"afterpay_clearpay": true,
					"apple_pay": true,
					"cash_app_pay": true,
					"google_pay": true
				}
			}
		};
		
		modules.request({
			uri: uri,
			method: 'POST',
			qs: {},
			json: checkout,
			headers: {
				'Authorization': 'Bearer ' + access_token,
				'Content-Type': 'application/json',
				'Square-Version': '2022-09-21'
			},
			timeout: 3000
		}, function(e, r, body)
		{
			res.send({
				"location": body?.payment_link?.url,
				"notify": (body.errors ? (body.errors[0].detail) : (body?.payment_link?.url ? "Redirecting." : "..."))
			});
		});
	});
*/

// ==========================================================================
// NODE - SQUARE - EXPORTS
// ==========================================================================

	return exports;
};
