app.run(function($rootScope, $http, $templateCache, editableOptions, editableThemes)
{

//==========================================================================
// CART
//==========================================================================
	
	$rootScope.cart = $rootScope.cart || {};
	
	$rootScope.cart.disabled = false;
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
			$rootScope.cart.current.count = Object.keys($rootScope.cart.current.items).length;
			$rootScope.cart.current.qty = 0;
			
			$rootScope.cart.current.payments = $rootScope.cart.current.payments || {};
			$rootScope.cart.current.amount = 0;
			$rootScope.cart.current.paid = 0;
			$rootScope.cart.current.taxes = 0;
			$rootScope.cart.current.fees = 0;
			$rootScope.cart.current.due = 0;
			
			_.each($rootScope.cart.current.items, function(item)
			{
				var elm = $('.entry.item#' + item.id);
				
				if (elm.length)
				{
					
					item.price = item.price !== null ? item.price : (parseInt($(elm).data('msrp')) || null);
					item.amount = item.price; // reset total price
					
					item.title = $(elm).find('.item-title').text();
					item.description = ($(elm).find('.item-addons')[0] || {}).innerText || null;
					
					var copy = $($(elm).find('.item-addons')[0].innerHTML);
					
					$(copy).find('.item-addon-price').remove();
					
					// include a clean version of the item description (w/o prices);
					item.subject = $(copy).text().replace(/\n\n/g, '').replace(/\n/g, ' ').trim() || null;
					
					_.each($(elm).find('[data-addon]'), function(addon) {
						item.amount += $(addon).data('addon') || 0;
					});
				}
				
				$rootScope.cart.current.qty += item.qty || 0;
				
				if (item.qty)
				{
					$rootScope.cart.current.amount += item.amount * item.qty;	
				}
			});
			
			$rootScope.cart.current.due = $rootScope.cart.current.amount;

			_.each($rootScope.cart.current.payments, function(payment)
			{
				
/*
				if (payment.taxes) $rootScope.cart.current.taxes += payment.taxes;
				if (payment.fees) $rootScope.cart.current.fees += payment.fees;
				if (payment.paid) $rootScope.cart.current.paid += payment.paid;
*/
				
			});
			
			delete $rootScope.cart.current.payload;
			
			$rootScope.cart.carts.list[$rootScope.cart.current.id] = $rootScope.cart.current;
			
			$rootScope.cart.carts.count = Object.keys($rootScope.cart.carts.list).length;
			
			localStorage['cart'] = JSON.stringify($rootScope.cart.current);
			localStorage['carts'] = JSON.stringify($rootScope.cart.carts);
			
			$rootScope.cart.current.payload = JSON.stringify($rootScope.cart.current);
			
			$timeout(function() {
				$rootScope.cart.saving = false;
			}, 100);
		});
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
		};

		$rootScope.notify({
			type: 'question',
			memo: 'Delete cart?'
		}, function(c)
		{
			if (c.value) proceed();
		});
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
		
		console.log(nextLink);
		
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
		if ($rootScope.cart.disabled) return;
		
		if (!$rootScope.cart.current) $rootScope.cart.new();
			
		var ts = Date.now();
		var id = (id || ts).toString();
		var ITEM = node.data.payload.items[sku];
		var item = {id: id, sku: sku, qty: 1, ts: ts, modifiers: {}, amount: 0, price: null};
		
		item.ref = '#' + id.substr(-4);
		
		if (ITEM) _.each(ITEM.item_data.modifier_list_info, function(modifier) {
			_.each(modifier.modifier_overrides, function(override) {
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
					
					item.modifiers[modifier.modifier_list_id][selection_type == 'SINGLE' ? modifier.modifier_list_id : override.modifier_id] = {
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
		
		if (action == 'delete') return $timeout(function()
		{
			// to-do: emit required signals
			
			console.log(method);
			
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
			method.taxes = 0;
			method.amount = $rootScope.cart.current.due;
			
			/*
			if (method.fee && method.fee.interchange)
			{
				method.fees += (method.amount * (method.fee.interchange / 100));
			}
			
			if (method.fee && method.fee.processing)
			{
				method.fees += method.fee.processing;
			}
			
			method.amount += method.fees; // apply fees

			method.taxes = (method.amount * ((method.tax || 0) / 100)); // taxes
			
			method.amount += method.taxes; // tax
			
			method.amount -= $rootScope.cart.current.paid; // applied credits
			*/

			$rootScope.cart.current.payments[method.id] = method;
			
			$rootScope.cart.store();
		});
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


