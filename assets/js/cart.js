app.run(function($rootScope, $http, $templateCache, editableOptions, editableThemes)
{

//==========================================================================
// CART
//==========================================================================
	
	$rootScope.cart = $rootScope.cart || {};
	
	$rootScope.cart.fit = false;
	$rootScope.cart.carts = JSON.parse(localStorage['carts'] || null) || {count: 0, list: {}};
	$rootScope.cart.current = localStorage['cart'] ? JSON.parse(localStorage['cart']) : null;
	$rootScope.cart.saving = false;

	$rootScope.$on('$locationChangeStart', function(e, newPath, oldPath) // success
	{
		$rootScope.cart.fit = false;
	});

	$rootScope.cart.store = function()
	{
		$rootScope.cache.confirm = null;
		
		$rootScope.cart.carts.list = $rootScope.cart.carts.list || {};
		
		$rootScope.cart.saving = true;
			
		$timeout(function()
		{
			if (!$rootScope.cart.current) return (function()
			{
				$rootScope.cart.saving = false;
			})();
			
			$rootScope.cart.current.id = ($rootScope.cart.current.id || $rootScope.cart.current.ts).toString();
			$rootScope.cart.current.ref = '#' + $rootScope.cart.current.id.substr(-4);
			//$rootScope.cart.current.count = Object.keys($rootScope.cart.current.items).length;
			$rootScope.cart.current.qty = 0;
			$rootScope.cart.current.payments = $rootScope.cart.current.payments || {};
			$rootScope.cart.current.amount = 0;
			$rootScope.cart.current.paid = 0;
			$rootScope.cart.current.tax = 0;
			$rootScope.cart.current.taxes = 0;
			$rootScope.cart.current.fees = 0;
			$rootScope.cart.current.due = 0;
			
			_.each($rootScope.cart.current.items, function(item)
			{
				item.qty = item.qty || 0;
				
				item.tax = item.tax || 0;
				item.taxes = 0; // zero out tax due to calculate
				
				item.amount = item.price == 0 ? 0 : (item.price || item.msrp || 0); // set item cost
				item.tags = [];
				
				// add modifier costs to item cost
				_.each(item.modifiers, function(modifiers)
				{
					_.each(modifiers, function(modifier)
					{
						if (modifier.value)
						{
							item.tags.push(modifier.name);
							
							item.amount += modifier.amount || 0;
						}
					})
				});
				
				item.amount = (item.amount * item.qty); // multiply cost by qty.

				if (item.tax) // add taxes to item based on item's tax
				{
					var taxes = (item.amount * (item.tax / 100) / 10).toString().split('.');
					
					taxes[0] = parseInt(taxes[0] || 0);
					
					if (taxes[1] && taxes[1].substr(0, 1) > 5) taxes[0] += 1;
					
					item.taxes = taxes[0];
				}
				
				
				
				item.description = item.tags.join(', ').trim();
				
				// append breakdown onto cart calcs.
				$rootScope.cart.current.amount += item.amount;
				$rootScope.cart.current.taxes += item.taxes;
				$rootScope.cart.current.qty += item.qty || 0;
			});
			
			$rootScope.cart.current.due = $rootScope.cart.current.amount;
			
/*

			_.each($rootScope.cart.current.payments, function(payment)
			{
				if (payment.paid)
				{
					$rootScope.cart.current.paid += payment.paid;
					$rootScope.cart.current.due -= payment.paid;
				}
			});
*/
			
			delete $rootScope.cart.current.payload;
			
			$rootScope.cart.carts.list[$rootScope.cart.current.id] = $rootScope.cart.current;
			
			$rootScope.cart.carts.count = Object.keys($rootScope.cart.carts.list).length;
			
			localStorage['cart'] = JSON.stringify($rootScope.cart.current);
			localStorage['carts'] = JSON.stringify($rootScope.cart.carts);
			
			$rootScope.cart.current.payload = JSON.stringify($rootScope.cart.current);
			
			$timeout(function()
			{
				$rootScope.cart.saving = false;
			});
		});
	};
		
	$rootScope.cart.load = function(id)
	{
		if (!$rootScope.cart.carts.list[id]) return $rootScope.cart.store();
		
		$rootScope.cart.current = $rootScope.cart.carts.list[id];
		
		$rootScope.cart.store();
	};
		
	$rootScope.cart.unload = function()
	{
		$rootScope.cart.store();
		
		$rootScope.cart.current = null;
		
		localStorage.removeItem('cart');
	};
		
	$rootScope.cart.delete = function(id)
	{
		var proceed = function()
		{
			if ($rootScope.cart.current && $rootScope.cart.current.id == id)
			{
				$rootScope.cart.current = null;
				
				localStorage.removeItem('cart');
			}
			
			$rootScope.cart.saving = true;
			
			delete $rootScope.cart.carts.list[id];
			
			$rootScope.cart.carts.count = Object.keys($rootScope.cart.carts.list).length;
			
			localStorage['carts'] = JSON.stringify($rootScope.cart.carts);

			$timeout(function() {
				$rootScope.cart.saving = false;
			});

			$rootScope.navigate('/carts');
		};
		
		proceed();

/*
		$rootScope.notify({
			type: 'question',
			memo: 'Delete cart?'
		}, function(c)
		{
			if (c.value) proceed();
		});
*/
	};
		
	$rootScope.cart.new = function()
	{
		// store current cart
		if ($rootScope.cart.current && $rootScope.cart.current.id)
		{
			var carts = JSON.parse(localStorage['carts'] || null) || $rootScope.cart.carts || {};
			
			carts.list = carts.list || {};
			
			carts.list[$rootScope.cart.current.id] = $rootScope.cart.current;
			
			carts.count = Object.keys(carts.list).length;
			
			$rootScope.cart.carts = carts;
			
			localStorage['carts'] = JSON.stringify(carts);
		}

		var cart = {
			status: 'OPEN',
			ts: Date.now(),
			items: {},
			skus: {},
			qty: 0,
			handling: 'TAKEOUT',
			payments: {},
			confirmed: {}
		};
		
		//cart.id = cart.ts.toString();
		//cart.id = (Array.from({length: 2}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('') + Array.from({length: 1}, () => Math.floor(Math.random() * 10)).join('') + Date.now().toString().substr(-3);
		cart.id = [...'ABCDEFGHKMNPRSTWXZ'].sort(() => Math.random() - 0.5).slice(0, 2).join('') + Array.from({ length: 2 }, () => Math.floor(Math.random() * 10)).join('') + String(Math.floor(Date.now() / 1000)).slice(-2);
;

		$rootScope.navigate('/menu');
		
		$rootScope.cart.current = cart;
		
		$rootScope.cart.store();
	};
	
	$rootScope.cart.navigate = function(direction)
	{
		direction = direction || 'next';
		
		var nextLink = null;
		
		if (direction == 'next')
		{
			if ($('.active-step').next().length)
			{
				nextLink = $('.active-step').next().find('a');
			}
			
			if (!nextLink && $('.active-entry').next().length)
			{
				nextLink = $('.active-entry').next().find('.entry-link');
			}
			
			if (!nextLink && $('.item.entry').length)
			{
				nextLink = $('.item.entry').first().find('.entry-link');
			}
		}
		
		if (direction == 'prev')
		{
			if ($('.active-step').prev().length)
			{
				nextLink = $('.active-step').prev().find('a');
			}
			
			if (!nextLink && $('.active-entry').prev().length)
			{
				nextLink = $('.active-entry').prev().find('.entry-link');
			}
			
			if (!nextLink && $('.item.entry').length)
			{
				nextLink = $('.item.entry').last().find('.entry-link');
			}
		}
		
		if (nextLink.length && $(nextLink).attr('href') == $location.$$url) nextLink = null;

		if (nextLink.length)
		{
			$(nextLink).trigger('click');
		} else {
			$rootScope.navigate('/menu');
		}
	};
	
	$rootScope.cart.reset = function(sku, id)
	{
		$rootScope.notify({
			type: 'question',
			memo: 'Are you sure?'
		}, function(c)
		{
			if (c.value) $rootScope.cart.append(sku, id);
		});
	};
	
	$rootScope.cart.append = function(sku, id)
	{
		if (!$rootScope.cart.current) $rootScope.cart.new();
			
		var ts = Date.now();
		var id = (id || ts).toString();
		var ITEM = node.data.payload.items[sku];
		var TAX = null; try {
			TAX = $rootScope.node.data.payload.items[ITEM.item_data.tax_ids[0]].tax_data;
		} catch(err) {};

		var item = {
			id: id,
			sku: sku,
			qty: 1,
			ts: ts,
			modifiers: {},
			msrp: 0,
			amount: 0,
			taxes: 0,
			tax: 0,
			price: null
		};
		
		item.ref = '#' + id.substr(-4);
		
		if (ITEM) try {
			item.msrp = ITEM.item_data.variations[0].item_variation_data.price_money.amount;
			item.amount = item.msrp;
		} catch(err) {};
		
		if (ITEM) item.title = ITEM.item_data.name;
		
		if (TAX)
		{			
			item.tax = parseFloat(TAX.percentage) * 10;
		}

		if (ITEM) _.each(ITEM.item_data.modifier_list_info, function(modifier)
		{
			_.each(modifier.modifier_overrides, function(override)
			{
				if (override.on_by_default)
				{
					if (!item.modifiers[modifier.modifier_list_id])
					{
						item.modifiers[modifier.modifier_list_id] = {};
					}
					
					var selection_type = 'SINGLE'; try {
						selection_type = $rootScope.node.data.payload.items[modifier.modifier_list_id].modifier_list_data.selection_type;
					} catch(err) {};
					
					if (modifier.min_selected_modifiers == 1 && modifier.max_selected_modifiers == 1)
					{
						selection_type = 'SINGLE';
					}
					
					var MODIFIER = _.find(node.data.payload.items[modifier.modifier_list_id].modifier_list_data.modifiers, {
						id: override.modifier_id
					});
					
					item.modifiers[modifier.modifier_list_id][selection_type == 'SINGLE' ? modifier.modifier_list_id : override.modifier_id] = {
						name: MODIFIER && MODIFIER.modifier_data && MODIFIER.modifier_data.name,
						amount: MODIFIER && MODIFIER.modifier_data && MODIFIER.modifier_data.price_money && MODIFIER.modifier_data.price_money.amount,
						value: override.modifier_id
					};
				}
			});
		});
		
		$rootScope.cart.current.items[id] = item;
		
		$rootScope.cart.current.skus[sku] = $rootScope.cart.current.skus[sku] || {qty: 0, items: {}};
		
		$rootScope.cart.current.skus[sku].items[id] = true;
		
		$rootScope.cart.current.skus[sku].qty = Object.keys($rootScope.cart.current.skus[sku].items).length;
		
		$timeout($rootScope.cart.store);

	};
	
	$rootScope.cart.remove = function(sku, id)
	{
		if (!$rootScope.cart.current) $rootScope.cart.new();
		
		var item = $rootScope.cart.current.items[id];
		var proceed = function()
		{
			delete $rootScope.cart.current.items[id];
			
			delete $rootScope.cart.current.skus[sku].items[id];
			
			$rootScope.cart.current.skus[sku].qty = Object.keys($rootScope.cart.current.skus[sku].items).length;
			
			if (!$rootScope.cart.current.skus[sku].qty) delete $rootScope.cart.current.skus[sku];

			$rootScope.cart.store();
		};
		
		if (!item || (!item.notes && !item.modifiers['undefined'])) return proceed();
		
		$rootScope.notify({
			type: 'question',
			memo: 'Delete item?'
		}, function(c)
		{
			if (!c.value) return;
			
			if ($rootScope.query.id == id) $rootScope.navigate('/menu');
			
			proceed();
		});
	};
	
	$rootScope.cart.purge = function()
	{
		$rootScope.notify({
			type: 'question',
			memo: 'Remove all carts?'
		}, function(c)
		{
			if (!c.value) return;
			
			$rootScope.cart.current = null;
			$rootScope.cart.carts = {count: 0, list: {}};
			
			localStorage.removeItem('cart');
			localStorage.removeItem('carts');
		});
	};

//==========================================================================
// CART - PAY
//==========================================================================
	
	$rootScope.cart.pay = function(method, action)
	{
		if (!$rootScope.cart.current) return alert('No cart is loaded.');
			
		console.log('$rootScope.cart.pay', method, action);
		
/*
		if (action == 'delete') return $timeout(function()
		{
			// to-do: emit required signals
			
			delete $rootScope.cart.current.payments[method.id];
			
			UIkit.update($('[uk-sticky]'), 'update');
			
			$rootScope.cart.store();
		});
		
		if (!action) return $timeout(function()
		{
			method = angular.copy(method);
			
			method.ts = Date.now();
			method.id = method.ts.toString();
			method.fees = 0;
			method.paid = 0;
			method.tax = 0;
			method.amount = $rootScope.cart.current.amount - $rootScope.cart.current.paid;

			if (method.fee && method.fee.interchange)
			{
				method.fees += (method.amount * (method.fee.interchange / 100));
			}
			
			if (method.fee && method.fee.processing)
			{
				method.fees += method.fee.processing;
			}
			
			method.amount += method.fees; // apply fees

			method.tax = (method.amount * ((method.tax || 0) / 100)); // tax
			
			method.amount += method.tax; // tax
			
			

			$rootScope.cart.current.payments[method.id] = method;
			
			$rootScope.cart.store();
		});
*/
	};

//==========================================================================
// CART - LISTENERS
//==========================================================================

	window.addEventListener("unload", (event) =>
	{
		$rootScope.cart.store();
	});
});








//==========================================================================
// DIRECTIVES - ONSCREEN KEYBOARD
//==========================================================================

/*
app.directive('keyboard', function($rootScope, $timeout) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs)
        {
	        //if ($rootScope.data.remote) return;
	        //if ($rootScope._IS_TOUCH) return;
	        
	        if (['date', 'time'].indexOf(attrs.type) > -1)
	        {}
	        
	        if (attrs.ngModel == 'keyboard.focus.value') return;
	        
	        //elem[0].addEventListener('focus', function(e) {
	        $(elem[0]).on('focus', function(e) {
		        $timeout(function()
		        {
			        var v = $(elem[0]).val();
			        
					$rootScope.keyboard.focus = {
					    $scope: scope,
					    elem: elem[0],
					    type: elem[0].keyboard == '$' ? 'money' : attrs.type,
					    background: attrs.background == 'false' ? false : true,
					    src: attrs.src || null,
					    key: attrs.key || null,
					    min: attrs.min || null,
					    max: attrs.max || null,
					    typeahead: attrs.typeahead != undefined,
					    //integrity: v || null,
					    value: attrs.autocomplete == 'off' ? null : (v || null),
					    h: '1', m: '05', a: 'PM', // hour, minute, am/pm
					};
					
			        console.log('***** Keyboard', $rootScope.keyboard.focus);
		        });
			});
        }        
    };
});
*/


