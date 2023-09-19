app.run(function($rootScope, $http, $templateCache, editableOptions, editableThemes) {
	
	$rootScope.keyboard = {
		//focus: null,
		//focus: {debug: true, type: 'text', caps: false, value: 'this is a simple test', h: '1', m: '05', a: 'PM'},
		//focus: {debug: true, type: 'text', value: 'al', src: '/api/pos/lookup', key: '_id'},
		cancel: function()
		{
			if ($rootScope.keyboard.focus.elem) try {
				angular.element($rootScope.keyboard.focus.elem.form).scope().$form.$cancel();
			} catch(err) {};
			
			$rootScope.keyboard.focus = null;
		},
		init: function()
		{
			$timeout(function()
			{
				//$('[ng-model="keyboard.focus.value"]').focus();
				
				$rootScope.keyboard.typeahead();
			});
		},
		clear: function()
		{
			$timeout(function()
			{
				$rootScope.keyboard.focus.value = null;
				
				$('[ng-model="keyboard.focus.value"]').focus();
			});
		},
		close: function()
		{
			var v = $rootScope.keyboard.focus.value;
			
			if (v && $rootScope.keyboard.focus.type == 'date')
			{
				v = moment(v).format('YYYY-MM-DD');
			}
			
			if (v && $rootScope.keyboard.focus.type == 'time')
			{
				if (v.length > 4)
				{
					v = moment('07/15/1988 ' + v).format('HH:mm:ss');
				}
				else
				{
					var n = v.match(/\d+/)[0];
					var t = v.match(/[a-zA-Z]/)[0];
					var m = {
						'm': 'minutes',
						'h': 'hours'
					};
					
					v = moment(Date.now()).add(n, m[t]).format('HH:mm:ss');
				}
			}
			
			if ($rootScope.keyboard.focus.min && v < $rootScope.keyboard.focus.min) v = $rootScope.keyboard.focus.min;
			
			var elem = $rootScope.keyboard.focus.elem;
			
			if (elem)
			{
				if ($(elem).find('input').length) elem = $(elem).find('input')[0]; // if for nested input
				
				//if ($(elem).attr('ng-model')) jQuery(elem).data('$ngModelController').$setViewValue(v);
				
				//jQuery(temp1).data('$ngModelController').$setViewValue('4')
				if (elem.nodeName == 'BUTTON')
				{
					jQuery(elem).data('$ngModelController').$setViewValue($rootScope.keyboard.focus.type == 'number' ? (parseInt(v) || null) : v);
				}
				
				if (elem) $(elem).val(v).trigger('change').trigger('blur');
				
				if ($('[editable-form="$form"]').find(elem).length) $timeout(function() {
					$('[editable-form="$form"]').submit();
				});	
			}
			
			$rootScope.keyboard.focus = null;
		},
		pressed: function($event, option)
		{
			$('[ng-model="keyboard.focus.value"]').focus();
			
			option.pressed = true;
			
			$timeout(function() {
				option.pressed = false;
			}, 100);
			
			$rootScope.keyboard.typeahead();
		},
		typeahead: function()
		{
			$('[ng-model="keyboard.focus.value"]').focus();
			
			if ($rootScope.keyboard.focus.typeahead)
			{
				$($rootScope.keyboard.focus.elem).val($rootScope.keyboard.focus.value).trigger('change');
			}
			
			if ($rootScope.keyboard.focus.src) $timeout(function() // remote search
			{
				var after = function(r)
				{
					$rootScope.keyboard.focus.results = r.data;
				};
				
				if ($rootScope.keyboard.focus.value) return $http.post($rootScope.keyboard.focus.src, {
					q: $rootScope.keyboard.focus.value
				}).then(after, after);
				
				after({data: null});
			});
		},
		press: function($event, option)
		{
			var caps = $rootScope.keyboard.focus.caps || $rootScope.keyboard.focus.shift;
			var value = caps && option.caps ? option.caps : (option.value || option.key);
			var str = $rootScope.keyboard.focus.value;
			
			if (value == ' ' && str.substr(-1) == ' ') $rootScope.keyboard.focus.value = str.substr(0, str.length - 1) + '.';
			
			//console.log(value); //insertAtCursor($('#keyboard_input')[0], value);

			if (!$rootScope.keyboard.focus.value) $rootScope.keyboard.focus.value = '';
			
			$rootScope.keyboard.focus.shift = $rootScope.keyboard.focus.caps ? true : false;
			$rootScope.keyboard.focus.value += value;
			
			if ($rootScope.keyboard.focus.type == 'money')
			{
				var v = $rootScope.keyboard.focus.value.match(/\d/g).join('');
				
				$rootScope.keyboard.focus.value = value == '.' ? (parseInt(v) + '.') : $rootScope.formatPrice(parseInt(v) / 100).toString();
			}
		},
		toggleable: ['text', 'number'],
		keyboards: {
			date: {name: 'Date'},
			time: {name: 'Time'},
			number: {
				name: 'Number',
				nickname: '123',
				rows: [
					[
						{key: ''},
						{key: ''},
						{key: 'Delete', img: '/assets/img/back-space.svg', fn: function()
						{
							if ($rootScope.keyboard.focus.value)
							{
								$rootScope.keyboard.focus.value = $rootScope.keyboard.focus.value.slice(0, -1);
							}
						}}
					],
					[
						{key: '1'},
						{key: '2'},
						{key: '3'}
					],
					[
						{key: '4'},
						{key: '5'},
						{key: '6'}
					],
					[
						{key: '7'},
						{key: '8'},
						{key: '9'}
					],
					[
						{key: 'Clear', img: '/assets/img/eraser.svg', fn: function() {$rootScope.keyboard.focus.value = null;}},
						{key: '0'},
						{key: '.'}
					]
				]
			},
			text: {
				name: 'Text',
				nickname: 'ABC',
				rows: [
					[ 
						{key: '1', caps: '!'},
						{key: '2', caps: '@'},
						{key: '3', caps: '#'},
						{key: '4', caps: '$'},
						{key: '5', caps: '%'},
						{key: '6', caps: '^'},
						{key: '7', caps: '&'},
						{key: '8', caps: '*'},
						{key: '9', caps: '('},
						{key: '0', caps: ')'},
						{key: '-', caps: '_'},
						{key: '=', caps: '+'},
						{key: 'Delete', img: '/assets/img/back-space.svg', fn: function()
						{
							if ($rootScope.keyboard.focus.value)
							{
								$rootScope.keyboard.focus.value = $rootScope.keyboard.focus.value.slice(0, -1);
							}
						}}
					],
					[
						{key: 'Tab', img: '/assets/img/tab.svg', value: '\t'},
						{key: 'q', caps: 'Q'},
						{key: 'w', caps: 'W'},
						{key: 'e', caps: 'E'},
						{key: 'r', caps: 'R'},
						{key: 't', caps: 'T'},
						{key: 'y', caps: 'Y'},
						{key: 'u', caps: 'U'},
						{key: 'i', caps: 'I'},
						{key: 'o', caps: 'O'},
						{key: 'p', caps: 'P'},
						{key: '[', caps: '{'},
						{key: ']', caps: '}'},
						{key: '\\', caps: '|'}
					],	
					[
						{key: ''},
						{key: 'a', caps: 'A'},
						{key: 's', caps: 'S'},
						{key: 'd', caps: 'D'},
						{key: 'f', caps: 'F'},
						{key: 'g', caps: 'G'},
						{key: 'h', caps: 'H'},
						{key: 'j', caps: 'J'},
						{key: 'k', caps: 'K'},
						{key: 'l', caps: 'L'},
						{key: ';', caps: ':'},
						{key: '\'', caps: '"'},
						{key: 'Return', img: '/assets/img/left-arrow.svg', value: '\r\n'}
					],
					[
						{key: 'Shift', img: '/assets/img/shift.svg', shift: '/assets/img/shift-solid.svg', caps: '/assets/img/shift-cap.svg', fn: function()
						{	
							if ($rootScope.keyboard.focus.caps)
							{
								$rootScope.keyboard.focus.caps = false;
								$rootScope.keyboard.focus.shift = false;
							} else {
								if ($rootScope.keyboard.focus.shift)
								{
									$rootScope.keyboard.focus.caps = true;
								}
								
								$rootScope.keyboard.focus.shift = true;
							}
						}},
						{key: 'z', caps: 'Z'},
						{key: 'x', caps: 'X'},
						{key: 'c', caps: 'C'},
						{key: 'v', caps: 'V'},
						{key: 'b', caps: 'B'},
						{key: 'n', caps: 'N'},
						{key: 'm', caps: 'M'},
						{key: ',', caps: '<'},
						{key: '.', caps: '>'},
						{key: '/', caps: '?'},
						{key: 'Shift', img: '/assets/img/shift.svg', shift: '/assets/img/shift-solid.svg', caps: '/assets/img/shift-cap.svg', fn: function()
						{	
							if ($rootScope.keyboard.focus.caps)
							{
								$rootScope.keyboard.focus.caps = false;
								$rootScope.keyboard.focus.shift = false;
							} else {
								if ($rootScope.keyboard.focus.shift)
								{
									$rootScope.keyboard.focus.caps = true;
								}
								
								$rootScope.keyboard.focus.shift = true;
							}
						}},
					],
					[
						{key: 'Clear', img: '/assets/img/eraser.svg', width: '120px', fn: function() {$rootScope.keyboard.focus.value = null;}},
						{key: 'Space', value: ' '},
						{key: '', width: '120px'},
					]	
				]
			}
		},
		sku: { // $rootScope.keyboard.sku.submit('038778830321');
			value: '',
			searching : false,
			submit: function(v)
			{			
				return console.log('sku lookup coming soon again..');
					
				var after = function(r)
				{
					$rootScope.keyboard.sku.searching = false;
					
					$rootScope.add.submit(r.data.id, r.data.variation);
				};
				
				var q = $rootScope.url.parse(v);
				
				if (q.m) return $timeout(function()
				{
					$rootScope.data.ticket.m = q.m; $rootScope.ticket.sync({status: 'OPEN'});
				});
				
				$rootScope.keyboard.sku.searching = true;
				
				$http.post('/api/pos/sku', {sku: v}).then(after, after);
			}
		}
	};
	
	$rootScope.keyboard.keyboards.money = $rootScope.keyboard.keyboards.number;

});






//==========================================================================
// TURN - DIRECTIVES - ONSCREEN KEYBOARD
//==========================================================================

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


