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

var getElemDistance = function ( elem ) {
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
	        
	        console.log(attrs);
	        	
	        jQuery(elem[0]).fitText((parseFloat(attrs.fitText) || 1.2), options);
  
        }        
    };
});
