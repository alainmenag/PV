app.run(function($rootScope, $http, $templateCache, editableOptions, editableThemes)
{

//==========================================================================
// CART
//==========================================================================
	
	$rootScope.cart = $rootScope.cart || {};

	$rootScope.cart.carts = JSON.parse(localStorage['carts'] || null) || {count: 0, list: {}};
	
	$rootScope.cart.current = localStorage['cart'] ? JSON.parse(localStorage['cart']) : null;
	
	$rootScope.cart.saving = false;
	
	$rootScope.cart.store = function()
	{
		$rootScope.cart.carts.list = $rootScope.cart.carts.list || {};
			
		$timeout(function()
		{
			$rootScope.cart.current.id = ($rootScope.cart.current.id || $rootScope.cart.current.ts).toString();
			$rootScope.cart.current.ref = '#' + $rootScope.cart.current.id.substr(-4);
			$rootScope.cart.current.count = Object.keys($rootScope.cart.current.items).length;
			$rootScope.cart.current.qty = 0;
			$rootScope.cart.current.amount = 0;
			
			_.each($rootScope.cart.current.items, function(item)
			{
				$rootScope.cart.current.qty += item.qty || 0;
				
				item.amount = 0; // reset total price
				
				var elm = $('.entry.item#' + item.id);
				
				if (elm.length)
				{
					item.title = $(elm).find('.item-title').text();
					item.description = ($(elm).find('.item-addons')[0] || {}).innerText || null;
					
					var copy = $($(elm).find('.item-addons')[0].innerHTML);
					
					$(copy).find('.item-addon-price').remove();
					
					// include a clean version of the item description (w/o prices);
					item.subject = $(copy).text().replace(/\n\n/g, '').replace(/\n/g, ' ').trim() || null;
				}
										
				try {
					item.amount += parseInt($(elm).find('[editable-number="ENTRY.price"]').text().match(/\d+/g).join(''));
				} catch(err) {};
				
				_.each($(elm).find('[data-addon]'), function(addon) {
					item.amount += $(addon).data('addon') || 0;
				});
				
				$rootScope.cart.current.amount += item.amount;
			});
			
			$rootScope.cart.carts.list[$rootScope.cart.current.id] = $rootScope.cart.current;
			
			$rootScope.cart.carts.count = Object.keys($rootScope.cart.carts.list).length;
			
			localStorage['cart'] = JSON.stringify($rootScope.cart.current);
			localStorage['carts'] = JSON.stringify($rootScope.cart.carts);
		
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

		var cart = {ts: Date.now(), items: {}, skus: {}, qty: 0};
		
		cart.id = cart.ts.toString();

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

		if (nextLink)
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


