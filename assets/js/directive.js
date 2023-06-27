//==========================================================================
// TURN - DIRECTIVES - LINKS
//==========================================================================

app.directive('href', function($timeout) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs)
        { 
	        if (!attrs.target) $timeout(function()
	        {
		        if (!attrs.target && attrs.href.indexOf('://') > -1) $(elem).attr('target', '_blank');
	        });
	        
	        $(elem).on('click', function()
	        {
		        $timeout(function()
		        {
			        if (!window.location.hash) return;
			        
			        var el = $(window.location.hash);
			        
			        if (el) $rootScope.scroll.to(el[0], 100);  
		        }); 
	        });
        }        
    };
});

//==========================================================================
// TURN - DIRECTIVES - LINKS
//==========================================================================

/*
app.directive('type', function($timeout) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs)
        {
	        if (elem[0].type == 'file') $(elem[0]).on('change', function(e)
	        { 
		        if (!elem[0].files[0]) return;
		        
				var reader = new FileReader();
				
				reader.onloadend = function()
				{
					elem[0].src = reader.result;
				};
				
				reader.readAsDataURL(elem[0].files[0]);
	        });
        }        
    };
});
*/


//==========================================================================
// TURN - DIRECTIVES - FETCH DATA
//==========================================================================

app.directive('fetchData', function($timeout) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs)
        {
	        var fetch = attrs.fetchData.substr(0, 1) == '/' || attrs.fetchData.substr(0, 4) == 'http';
	        
	        if (!fetch) return;
	        
	        scope.fetching = true;
	        
	        var after = function(r)
	        {
	        	scope.fetching = false;
		        scope.data = r.data;
	        };
	        
	        $http.get(attrs.fetchData).then(after, after);
        }        
    };
});

//==========================================================================
// TURN - DIRECTIVES - PREVENT DEFAULT
//==========================================================================

app.directive('preventDefault', function() {
    return {
        restrict:'A',
        link: function(scope, elem, attrs) {
	        
	        elem[0].onclick = function(e) {
		        
		        e.preventDefault();
			    
			};
	        
        }        
    };
});

//==========================================================================
// TURN - DIRECTIVES - PREVENT DEFAULT
//==========================================================================

app.directive('stopPropagation', function() {
    return {
        restrict:'A',
        link: function(scope, elem, attrs) {
	        
	        elem[0].onclick = function(e) {
		        
		        e.stopPropagation();
			    
			};
	        
	        elem[0].ondblclick = function(e) {
		        
		        e.stopPropagation();
			    
			};
	        
        }        
    };
});

//==========================================================================
// TURN - DIRECTIVES - ONSCREEN KEYBOARD
//==========================================================================

/*
app.directive('placeholder', function($rootScope, $timeout) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs)
        {
	        if ($rootScope.data.remote) return;
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
					    type: elem[0].placeholder == '$' ? 'money' : attrs.type,
					    background: attrs.background == 'false' ? false : true,
					    src: attrs.src || null,
					    key: attrs.key || null,
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

//==========================================================================
// TURN - DIRECTIVES - ROYAL SLIDER
//==========================================================================

app.directive('royalSlider', function($rootScope, $timeout) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs) {
	        
	        if (!attrs.id) attrs.id = 'slider_' + Date.now();
	        
	        var slider = {};
	        var go = function() {
		        
		        //if ($(elem).children(':visible').length <= 1) return;
		        
				var options = {
		            keyboardNavEnabled: true,
		            slidesSpacing: 0,
		            navigateByClick: false,
		            sliderDrag: true,
		            sliderTouch: false,
		            loop: true,
		            loopRewind: true,
					autoPlay: {
						enabled: true,
						delay: attrs.delay ? parseInt(attrs.delay) : 5000,
						stopAtAction: true,
						pauseOnHover: false
					}
		        };
		        
		        if (attrs.transitionType) options.transitionType = attrs.transitionType;
		        if (attrs.transitionSpeed) options.transitionSpeed = parseInt(attrs.transitionSpeed);
		
		        var i = $(elem).royalSlider(options);
		        
		        slider = $(i).data('royalSlider');
		        
		        $rootScope.cache[attrs.id] = slider;
		        
				slider.ev.on('rsAfterSlideChange', function(event) {
					$rootScope.$digest();
				});
						        
	        };
	        
	       $timeout(go);
  
        }        
    };
});

//==========================================================================
// TURN - DIRECTIVES - AUTOFOCUS
//==========================================================================

var getElemDistance = function( elem ) {
    var location = 0;
    if (elem.offsetParent) {
        do {
            location += elem.offsetTop;
            elem = elem.offsetParent;
        } while (elem);
    }
    return location >= 0 ? location : 0;
};

app.directive('autofocus', function($compile, $timeout) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs) {
			
	        if (!$(elem[0]).is(':visible')) return;
	        
	        $(elem[0]).trigger('focus');
	        
	        if (attrs.scroll == 'no') {
		        
		    } else {
			    //$('html, body').animate({scrollTop: getElemDistance(elem[0]) - 100}, 0);
			}

        }        
    };
});

//==========================================================================
// TURN - DIRECTIVES - LINKS
//==========================================================================

app.directive('id', function($timeout) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs)
        {
	        if (window.location.hash.length > 1 && attrs.id == window.location.hash.substr(1))
	        {
		        $('html, body').animate({scrollTop: getElemDistance(elem[0])}, 0);
	        }
        }        
    };
});

//==========================================================================
// TURN - DIRECTIVES - ROYAL SLIDER
//==========================================================================

if (window.app) app.directive('fitText', function() {
    return {
        restrict:'A',
        link: function(scope, elem, attrs) {
	        
	        if (!elem.id) elem.id = 'elem_' + Date.now();

	        var options = {};
	        
	        if (attrs.minFontSize) options.minFontSize = attrs.minFontSize;
	        if (attrs.maxFontSize) options.maxFontSize = attrs.maxFontSize;
	        	
	        jQuery(elem[0]).fitText((parseFloat(attrs.fitText) || 1.2), options);
  
        }        
    };
});

//==========================================================================
// TURN - DIRECTIVES - PREVIEW
//==========================================================================

app.directive('ngPreview',function($compile, $timeout, $rootScope, $http, $parse) {
    return {
        //restrict:'A',
        restrict: 'AEC',
        link: function(scope, elem, attrs)
        {
	        
	        $(elem).on('click', function(e)
	        {
		        if (!attrs.ngPreview) return;
		        
				var opened = $(elem).attr('data-open') == 1 ? 1 : 0;
				
				$(elem).attr('data-open', opened ? 0 : 1);
				
				if (!opened) $(elem).addClass('no-scroll');
				if (opened) $(elem).removeClass('no-scroll');
				
				$(elem).off('DOMMouseScroll mousewheel touchmove').on('DOMMouseScroll mousewheel touchmove', function(e)
				{
					$(elem).attr('data-open', 0);
				});
	        });	  
	               
			$(elem).on('swiped-right', function(e)
			{
				var t = $(e.target).prev();
				
				$(e.target).attr('data-open', 0).removeClass('no-scroll');
				
				$(t).addClass('no-scroll').attr('data-open', 1);
			});
			
			$(elem).on('swiped-left', function(e)
			{
				var t = $(e.target).next();
				
				$(e.target).attr('data-open', 0).removeClass('no-scroll');
				
				$(t).addClass('no-scroll').attr('data-open', 1);
			});
			
			$(elem).on('swiped-up', function(e)
			{
				$(e.target).attr('data-open', 0).removeClass('no-scroll');
			});
			
			$(elem).on('swiped-down', function(e)
			{
				$(e.target).attr('data-open', 0).removeClass('no-scroll');
			});
	        
	        
	              
        }        
    };
});

//==========================================================================
// TURN - DIRECTIVES - AUTOCOMPLETE
//==========================================================================

app.directive('autocomplete',function($compile, $timeout, $rootScope, $http, $parse) {
    return {
        //restrict:'A',
        restrict: 'AEC',
        link: function(scope, elem, attrs)
        {
	        if (
		        attrs.autocomplete == 'place'
		        || attrs.autocomplete == 'address'
		        || attrs.autocomplete == 'coordinates'
	        ) $timeout(function()
	        {
				var hiddenField = $(attrs.for);
				
				// prefill
				if ($(hiddenField).val()) (function()
				{
					var geocoder = new google.maps.Geocoder();
					var o = {};
					
					if (attrs.autocomplete == 'place') o.placeId = $(hiddenField).val();
					if (attrs.autocomplete == 'address') o.address = $(hiddenField).val();
					if (attrs.autocomplete == 'coordinates') o.address = $(hiddenField).val();
					
					geocoder.geocode(o, function(results)
					{
						try {
							$(elem).val(results[0].formatted_address);
						} catch(err) {};
					});
				})();
				
				//https://developers.google.com/maps/documentation/javascript/place-data-fields
				var autocomplete = new google.maps.places.Autocomplete(elem[0], {
					//bounds: defaultBounds,
					componentRestrictions: {country: 'us'},
					fields: [
						'place_id',
						'formatted_address',
						'geometry',
						//'name',
						//'address_components',
						//'icon',
						//'name',
						//'photos'
					],
					strictBounds: false,
					//types: ["establishment"],
				});
				
                google.maps.event.addListener(autocomplete, 'place_changed', function(e, b, c)
                {
	                var place = autocomplete.getPlace();
	                
					if (attrs.autocomplete == 'place') $(hiddenField).val(place.place_id);
					if (attrs.autocomplete == 'address') $(hiddenField).val(place.formatted_address);
					if (attrs.autocomplete == 'coordinates') $(hiddenField).val([
						place.geometry.location.lat(),
						place.geometry.location.lng()
					].join(' '));
					
	                console.log('place', place);
/*
                    setTimeout(function(){$('#input_auto').val('yyy');},50);
                    alert('pause1');
                    console.log(autocomplete,input_auto);
                    input_auto.value='xxx';
                    //autocomplete.set('xxx');
                    //autocomplete.setValues('xxx');
                    alert('pause2');
*/
                    
                });

	        });      
        }        
    };
});







app.directive('inputFill', function($timeout) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs)
        {
	        $timeout(function()
	        {
		       if (attrs.value) $(elem).val(attrs.value).trigger('change');
		        
	        }); 
        }        
    };
}); 
	
app.directive('systemForm', function($rootScope, $timeout, Upload) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs)
        {
	        scope.$form = scope[$(elem).attr('name')];
	        
	        var $form = scope.$form || {};
	        
	        $form.$saving = false;

	        $timeout(function() // wait for attrs to be filled
	        {
		        if (attrs.onsubmit) return;
		        
		        elem[0].submit = function(e)
		        {
			        e.preventDefault();
			        
			        var after = function(r)
			        {
			        	$form.$saving = false;
			        	
			        	console.log('done', r);

						try {$form.$setPristine();} catch(err) {};
						try {$form.$setUntouched();} catch(err) {};
						
				        if (r.data && (r.data.err || r.data.memo)) alert(r.data.err || r.data.memo);
				        
				        if (r.data && r.data.payload) if ($(elem).attr('key')) $timeout(function() {
					        setJsonValue($(elem).attr('key'), (r.data.payload|| r.data.data), window);
				        });
				        
				        if (attrs.reset) $(elem)[0].reset();
				        if (attrs.reload) $timeout($rootScope.templates.load); // reload view after submit
			        };
			        
			        var run = function()
			        {
				        var data = {};
				        
				        _.each($('[name]', elem), function(inpt)
				        {
					        var mdl = $(inpt).attr('ng-model');
					        var vlu = inpt.value;
					        
					        if (inpt.type == 'number') vlu = parseInt(vlu);
					        
					        if (
					        	inpt.type.indexOf('text') == -1
					        	&& (new RegExp('^[0-9]$')).test(inpt.value)
					        ) vlu = parseInt(vlu);
					        
					        //(new RegExp('^[0-9]$')).test(inpt.value)
					        //if (!vlu && scope[inpt.name]) vlu = scope[inpt.name];
					        
					        if (inpt.type == 'file' && inpt.files[0]) vlu = inpt.src;
					        

					        vlu = vlu || null;
					        
/*
					        if (inpt.type == 'file' && inpt.files[0]) vlu = {
						        src: inpt.src,
						        filename: inpt.files[0].name,
						        size: inpt.files[0].size,
						        type: vlu.type,
						        lastModified: inpt.files[0].lastModified,
						        ts: Date.now()
					        };
*/
					        					        
					        data[inpt.name] = vlu;
				        });
				        
				        //return console.log(data);

				        $form.$saving = true;
				        
						Upload.http({
							url: attrs.action,
							data: data,
							headers : {
								'Content-Type': 'application/json'
							}
						}).then(after, after, function(evt)
						{
							var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
							
							console.log('progress: ', progressPercentage, '% ', evt.config.data);
						});
				        
				        

/*
				        var data = $(elem).serialize();
				        
				        try {
					        if (e.originalEvent.submitter.name) data += (data.length ? '&' : '') + e.originalEvent.submitter.name + '=' + e.originalEvent.submitter.value
				        } catch(err) {};
				        
				        $form.$saving = true;
				        
						$http({
							method: attrs.method,
							data: data,
							url: attrs.action,
							headers: {
								accept: 'application/json',
								'content-type': 'application/x-www-form-urlencoded'
							}
						}).then(after, after);
*/
			        };
			        
			        var c = attrs.confirm === 'true' ? confirm('Are you sure?') : true;
			        
			        if (!c) return;
			        
			        var files = $('[type="file"]', elem[0]);
			        var load = files.length;
			        
			        if (!load) return run(); // if nothing to buffer
			        
			        var loaded = function()
			        {
				        load --; if (!load) return run();
			        };
				        
			        _.each(files, function(inpt, k) // read files into buffer as base64
			        {
						if (!inpt.files[0]) return loaded(inpt);
				       
						try
						{
							var reader = new FileReader();
							
							reader.onloadend = function()
							{
								inpt.src = reader.result;
								
								loaded(inpt);
							};
							
							reader.readAsDataURL(inpt.files[0]); 
						}
						catch(err) {
							loaded(inpt);
						};
			        });
		        };
		        
		        $(elem).off('submit').on('submit', elem[0].submit);
	        });
        }        
    };
}); 

	
app.directive('dt', function($rootScope, $timeout, $compile) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs)
        {
	        if (attrs.src != undefined) $timeout(function()
	        {
				var columns = [];
				
				_.each($('thead th', elem), function(th)
				{
			        var render = function(data, type, full, meta)
			        { 
				        var output = th.dataset.format ? Mustache.render(decodeURIComponent(th.dataset.format), full) : data;
						
						return output || data || '';
					};
					
					columns.push({
						data: th.dataset.key,
						render: render,
						searchable: th.dataset.searchable === 'true',
						sortable: th.dataset.sortable === 'false' ? false : true
					});
				});
				
				$(elem).DataTable({
					processing: true,
					serverSide: true,
					_ajax: {
						method: 'POST',
						url: attrs.src
					},
					ajax: function(data, callback, settings)
					{
						var a = function(r)
						{
							callback(r.data);
						}
						
						$http.post(attrs.src, data).then(a, a);
					},
					columns: columns
				});
	        });
        }        
    };
}); 

	
app.directive('dropdown', function($rootScope, $timeout, $compile) {
    return {
        restrict:'A',
        link: function(scope, elem, attrs)
        {
	        var button = elem[0].children[0];
	        var list = elem[0].children[1];
	        
	        $(button).attr('data-role', 'button');
	        $(list).attr('data-role', 'list');
	        
	        button.onclick = function(e)
	        {
		        e.preventDefault();
		        
		        $(elem).attr('data-state', $(elem).attr('data-state') == 'opened' ? 'closed' : 'opened');
	        }
	        
        }        
    };
}); 
