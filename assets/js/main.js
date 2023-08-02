var counts = {};

var main = function (
	$rootScope,
	$scope,
	$http,
	$filter,
	$location,
	$window,
	$timeout,
	$mdToast,
	$templateCache,
	$compile
) {
	$rootScope.site = window.site;
	$rootScope.node = window.node;
	$rootScope.session = window.session;
	$rootScope.uid = window.uid;
	$rootScope.gid = window.gid;
	$rootScope.tid = window.tid;
	$rootScope.cache = window.cache || {};

	window.$rootScope = $rootScope;
	window.$timeout = $timeout;
	window.$location = $location;
	window.$http = $http;
	
	$rootScope.uncashed = false;
	$rootScope.$rootScope = $rootScope;
	$rootScope.$ = window.$;
	$rootScope.$rootScope = $rootScope;
	$rootScope.$location = $location;
	$rootScope.Date = window.Date;
	$rootScope.Math = window.Math;
	$rootScope._ = window._;
	$rootScope.query = window.query || {};
	$rootScope.location = window.location;
	$rootScope.console = window.console;
	$rootScope.confirm = window.confirm;
	$rootScope.alert = window.alert;
	$rootScope.prompt = window.prompt;
	$rootScope.angular = angular;
	$rootScope.$http = $http;
	$rootScope.socket = window.socket;
	$rootScope._IS_TOUCH = isTouchDevice();
	$rootScope.parseInt = window.parseInt;
	$rootScope.parseFloat = window.parseFloat;
	$rootScope.encodeURIComponent = window.encodeURIComponent;
	$rootScope.decodeURIComponent = window.decodeURIComponent;
	$rootScope.platform = window.platform;
	$rootScope.isNaN = window.isNaN;
	$rootScope.atob = window.atob;
	$rootScope.btoa = window.btoa;
	
	$rootScope.location.loading = false;
	
	$rootScope.$watch('uncashed', function(v)
	{
		if (v) $timeout(function()
		{
			//console.log('***** Uncached:', v);
		
			$rootScope.uncashed = null;
		});
	});

	$rootScope.$on('$locationChangeStart', function(e, newPath, oldPath) // success
	{
		var _prev = $rootScope.url.parse(oldPath);
		var _path  = $rootScope.url.parse(newPath);
		
		$rootScope.query = _path;
		
		$rootScope.location.ts = Date.now();
		
		console.log('***** Query:', $rootScope.query);
		
		if (_prev.pathname != _path.pathname) $rootScope.templates.load(newPath);
		
		//$timeout($rootScope.state.store); // store location into breadcrumbs
	});

    $rootScope.cleanInput = function(data) {
	    
	    $timeout(function() {
		    console.log('data', data);
	    });
	    
	    return '';
    };

// ==========================================================================
// APPLET - PARSE URL
// ==========================================================================
		
	$rootScope.url = {
		parse: function(href)
		{
			href = href || '';
			
			if (!href) href = window.location.href;
			
			var query = decodeURI(href.split('?')[1] || '').split('#')[0];
			var queryJson = {};
			var a = document.createElement('a');
			
			//a.href = href.split('/')[1] || '';
			a.href = href;
			
			//if (a.pathname != '/') queryJson.stage = a.pathname.split('/').pop();
			
			queryJson.pathname = a.pathname;
			queryJson.hash = a.hash;
			
			if (query) {
				
				var parts = query.split('&');
				
				for (i = 0; i < parts.length; i++)
				{
					var splitParts = parts[i].split('=');
					var dataName = splitParts[0];
					var cleanDataname = dataName.replace(/\s+/g, '');
					
					queryJson[dataName] = decodeURIComponent(splitParts[1]);
					queryJson[cleanDataname] = decodeURIComponent(splitParts[1]);
				}		

			}
			
			return queryJson;
		}
	};
	
	$rootScope.query = $rootScope.url.parse(window.location.href);
	
// ==========================================================================
// APPLET - TEMPLATES
// ==========================================================================

	$rootScope.templates = {
		get: function(template, callback, track) {
			
			var track = track == undefined ? true : track;
			var template = template || null; if (!template) return;
			var callback = callback || function() {};
			var after = function(r) {
				
		        if (r.data) $templateCache.put(r.config.url, r.data);
				
				callback(r);
				
			};
			
			if ($templateCache.get(template)) callback({
				config: {url: template},
				data: $templateCache.get(template)
			});
			
			if (!$templateCache.get(template)) $http.get(template, {
				url: template
			}).then(after, after);
			
			// Store usage to pre-load most used
			if (track) (function() {
				
				if (!counts[template]) counts[template] = 0;
				
				counts[template] ++;
				
			})();
				
			if (Object.keys(counts).length) localStorage['counts'] = JSON.stringify(counts);

		},
		preload: function() {
			
			var list = Object.keys(counts).sort(function(a,b) {return counts[b]-counts[a];});
			
			// Load top 10 and remove anything past that	
			for (var i = 0; i < list.length; i++) if (i <= 10) {
				$rootScope.templates.get(list[i], null, false);
			} else {
				delete counts[list[i]];
			}
			
		},
		save: function() {
			
			localStorage['counts'] = JSON.stringify(counts);
			
		}
	};
	
	$rootScope.templates.load = function(url)
	{
		if (typeof url != 'string') url = null;
		
		var auto = url ? false : true;
		
		url = url || $location.$$url;
		
		$rootScope.location.loading = true;
		
		$http.post(url, {headers: {'Accept': 'application/json'}}).then(function(r)
		{
			$rootScope.location.loading = false;
			
			r.data = r.data && r.data.payload ? r.data.payload : {};
			
			var h = $compile(r.data.template)($rootScope);
			
			window.site = r.data.site;
			window.node = r.data.node;
			window.session = r.data.session;
				
			$('title').text(window.node.title || window.site.title);
			
			$timeout(function()
			{
				$rootScope.site = window.site;
				$rootScope.node = window.node;
				$rootScope.session = window.session;
				
				$('#main').html(h);
				
				$timeout($rootScope.state.store);
				
				if (!auto) $rootScope.scroll.up();
				
				$timeout(function() {$(window).resize();});
			});
		});
	};

	//$rootScope.templates.load(newPath);

// ==========================================================================
// APPLET - SCROLL
// ==========================================================================

	$rootScope.scroll = {
		holding: null,
		up: function() {
		
			$('html, body').animate({
				scrollTop: 0
			}, 0);
			
		},
		enable: function() {
			
			$('html').removeClass('noscroll').attr('data-scroll', true);
			
		},
		disable: function() {
			
			$('html').addClass('noscroll').attr('data-scroll', false);
			
		},
		top: function(elm) {
			
			var elm = elm || 'html';
			var el = $(elm);
			
			if (!el.length) return;
			
			$(elm).scrollTop(0);
			
		},
		bottom: function(elm) {
			
			var elm = elm || 'html';
			var el = $(elm);
			
			if (!el.length) return;
			
			$timeout(function() {
				$(elm).scrollTop(el[0].scrollHeight);
			});
	
		}
	};
	
	$rootScope.scroll.to = function(to, speed, offset) {
		
		var to = to || null; if (!to) return;
		var speed = speed || 0;
		var element = $(to); if (!element.length) return;
		var top = $(element).offset().top;
		var offset = offset || 0;
		
		$timeout(function() {
			
			$('html, body').animate({
				scrollTop: top + offset
			}, speed);
			
			//window.scrollTo(0, top);
			
		}, speed);
		
	};
	
	$rootScope.scroll.hold = function(hold) {

		if (
			$rootScope.scroll.holding != null
			|| hold === false
		) return (function() {
			
			var top = angular.copy($rootScope.scroll.holding);

			$rootScope.scroll.holding = null;
			
			$rootScope.scroll.enable();
			
			window.scrollTo(0, top);
								
		})();
		
		$rootScope.scroll.holding = $(document).scrollTop();
		
		$rootScope.scroll.disable();
	
	};













	
//==========================================================================
// APPLET - NOTIFY
//==========================================================================
	
	$rootScope.notify = function(options, callback) {
		
		var options = options.data || options || {};
		var callback = callback || function() {};
		var map = {
			200: 'success',
			0: 'error'
		};
		
		if (options.errors) [
			options.type = 'error',
			options.memo = _.pluck(options.errors, 'detail').join(' ')
		];
		
		if (!options.animation) options.animation = false;
		
		if (options.status) options.type = map[options.status] || 'error';
		if (options.statusText) options.memo = options.statusText;
		
		if (options.detail) [
			options.text = options.detail,
			delete options.detail
		];
		
		if (options.message) [
			options.text = options.message,
			delete options.message
		];
		
		if (options.memo) [
			options.text = options.memo,
			delete options.memo
		];
		
		if (options.type == 'question') options.showCancelButton = true;
		
		if (options.type == 'loading') [
			delete options.type,
			options.showConfirmButton = false,
			options.animation = false,
			options.customClass = 'bg-dark',
			options.imageWidth = 84,
			options.imageHeight = 84,
			options.imageUrl = ('/assets/vendor/SVG-Loaders-master/svg-loaders/circles.svg?cache=' + cache)
		];
		
		//$rootScope.notify({showConfirmButton: false, animation: false, customClass: 'bg-dark', imageUrl: '/assets/vendor/SVG-Loaders-master/svg-loaders/circles.svg?cache=' + cache});
		
		if (options.statusText && options.data) options.text = options.data;
		
		var after = function(c) {
			
			c = c || null;
						
			if (['esc', 'overlay', 'cancel'].indexOf(c) > -1) c = false;
						
			if (c) callback(c);
			
			$timeout(function() {
				
				swal.resetDefaults();
				
			});
			
			$rootScope.scroll.enable();
			
		};
		
		var html = options.html ? $compile(options.html)($rootScope) : null;
		
		if (options.html) options.html = $('<div id="swal_compiled" />');
		
		$rootScope.scroll.disable();
		
		try {
						
			swal(options).then(after, after);
			
			if (html) $timeout(function() {
				
				$('#swal_compiled').html(html);
				
			});
		
		} catch(err) {
			
			after();
			
		};

	};
	
	window.alert = function(msg)
	{
		$rootScope.notify(msg);
	};
	
	$rootScope.loader = {
		show: function() {
			
			$rootScope.notify({
				html: '<div class="spinner"></div>',
				showConfirmButton: false,
				allowEscapeKey: false,
				allowOutsideClick: false
			});
			
		},
		hide: function() {
			
			swal.close();
			
		}
	};




// ==========================================================================
// APPLET - OBJECT
// ==========================================================================

	$rootScope.object = {
		values: Object.values,
		clear: function(object) {
			
			if (!object) return;
			
			for (var k in object) delete object[k];
			
			return object;
			
		},
		modify: function(object, key, value, confirm, callback) {
			
			if (!key) return;
					
			object = object || {};
			callback = callback || function() {};
			
			var after = function() {
			
				$timeout(function() {
					
					setJsonValue(key, value, object);
					
					callback(object);
					
				});
				
			};
			
			if (!confirm) return after();
			
			$rootScope.notify({
				type: 'question',
				memo: confirm || 'Are you sure?'
			}, function(c) {
				
				if (c && c.value === true) after();
				
			});
			
		},
		add: function(parent, key, data) {
			
			$timeout(function() {
				
				var ts = Date.now();
				
				data.id = '_' + ts;
				
				setJsonValue([key, data.id].join('.'), data, parent);
				
			});
			
		},
		copy: function(data) {
			try {
				return angular.copy(data);
			} catch(err) {};
		},
		keys: function(object) {
			try {
				return Object.keys(object);
			} catch(err) {};
		},
		select: function(list, options, callback) {
			
			var name = 'typeahead-' + uuid();
	        var el = $('<input class="typeahead ' + name + '" type="text" placeholder="Start typing.." placeholder="Start typing..." style="width: 100%;" />');
			
			$rootScope.notify({
				html: el,
				showCloseButton: true,
				showConfirmButton: false
			}, function(c) {
				
				callback();
				
			});
			
			var o = {
				datumTokenizer: Bloodhound.tokenizers.obj.whitespace(options.value || 'value'),
				//datumTokenizer: Bloodhound.tokenizers.obj.whitespace('title'),
				//datumTokenizer: Bloodhound.tokenizers.obj.whitespace('owner', '$id'),
				queryTokenizer: Bloodhound.tokenizers.whitespace,
				//identify: function(o) {return o.uid;},
			};
			
			o.local = list;

			var engine = new Bloodhound(o);

			function suggestionsWithDefaults(q, sync, async) {				
			    if (q === '') {
				    sync(list);
			    } else {
				    engine.search(q, sync, async);
			    }			    
			}
			
			$('.' + name).typeahead(
				{
					minLength: 0,
					hint: true,
					highlight: true,
					classNames: {
						input: 'Typeahead-input',
						hint: 'Typeahead-hint',
						dataset: 'list-group text-left',
						selectable: 'list-group-item'
					}
				},
				{
					name: options.key || 'key',
					displayKey: options.value || 'value',
					source: suggestionsWithDefaults,
					templates: {
						notFound: function(q) {
						
							var html = ''
								+ '<div class="alert alert-danger">'
								+ 'No matches.'
								+ '</div>';
							
							return html;
							
						},
						pending: function(q) {
						
							var html = ''
								+ '<div class="alert alert-info">'
								+ 'Pending.'
								+ '</div>';
							
							return html;
							
						},
						suggestion: function(v) {
							
							var html = ''
								+ '<div>' + (v.Description || v) + '</div>';
							
							return html;
							
						},
					}
				}
			);
			 
	        $('.' + name).focus().bind('typeahead:select', function(ev, suggestion) {
				
				if (ev.type == 'typeahead:select') $timeout(function() {
					
					var selected = angular.copy(suggestion);
					
					callback(selected);
					
					swal.close();

				});
				
			});

			/*
			var options = options || {};
			var callback = callback || function() {};
			var $scope = $rootScope.$new();
			var template = ''
				+ '<div>'
				+ '<input ng-model="q" type="text" style="width: 100%;" placeholder="Search:" autofocus="" />'
				+ '<ul>'
				+ '<li ng-repeat="item in list | filter: q | limitTo: 5" class="text-left">'
				+ '<a ng-click="picked(item);">{{item.Description}}</a>'
				+ '</li>'
				+ '</ul>'
				
				+ '</div>';
			
			$scope.q = '';
			$scope.list = list;
			$scope.options = options;
			$scope.picked = function(item) {
				
				swal.close();
				
				var selected = angular.copy(item);
				
				callback(selected);	
				
			};
			
			var h = $compile(template)($scope);
			
			$rootScope.notify({
				html: '<div id="list_item_picker"></div>',
				showCloseButton: true,
				showConfirmButton: false
			}, function(c) {
				
				console.log(c);
				
			});
				
			$timeout(function() {
				
				$('#list_item_picker').html(h);
			});
			*/

		}
	};


	
// ==========================================================================
// APPLET - ARRAY
// ==========================================================================
		
	$rootScope.array = {
		select: $rootScope.object.select,
		add: function(parent, key, thing) {
			
			if (parent) $timeout(function() {
				
				if (!parent[key]) parent[key] = [];
				
				parent[key].push(thing);
				
			});
			
		},
		move: function(arr, old_index, new_index) {
			
/*
		    if (new_index >= arr.length) {
		        var k = new_index - arr.length + 1;
		        while (k--) {
		            arr.push(undefined);
		        }
		    }
*/
		    
		    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
		    
		    return arr; // for testing
		    
		},
		remove: function(confirm, parent, thing, callback) {
		
			var confirm = confirm || false;
			var callback = callback || function() {};
			
			var after = function() {
				
				$timeout(function() {
					
					try {
						delete parent[thing];
					} catch(err) {};
					
					try {
						
						var i = _.indexOf(parent, thing);
						
						if (i == 0) parent.shift();
						
						if (i > 0) parent.splice(i, 1);
										
					} catch(err) {};
					
					callback(true);
				
				});
	
			};
			
			if (!confirm) return after();
			
			if (confirm == true) confirm = 'Are you sure?';
	
			$rootScope.notify({
				type: 'question',
				memo: confirm,
				showCancelButton: true
			}, function(c) {
				
				if (c == true || c.value == true) return after(c);
				
				callback();
				
			});
				
		}
	};



	$rootScope.upload = {
		file: function(options)
		{
                var reader = new FileReader();
                
                reader.onload = function(e) {
	                
	                options.file = e.target.result;
	                
	                console.log(options);
	                
                };

                reader.readAsDataURL(options.file);
			
/*
			let formData = new FormData();
			
			formData.append("image", btoa(options.file));
			
			console.log('upload', options);
			
			
			$http({
			  method: 'POST',
			  url: '/api/data?collection=profiles&category=<%- node.data.profile.category %>',
			  data: formData,
			  headers: {
				  'Content-Type': 'multipart/form-data'
			  }
			}).then($rootScope.templates.load, $rootScope.notify);
*/
			
		}	
	};
	
	$rootScope.state =
	{
		list: [],
		init: function()
		{
			var key = 'history_' + window.gid;
			
			if (!window.sessionStorage[key]) window.sessionStorage[key] = '[]';
			
			try {
				$rootScope.state.list = angular.copy(JSON.parse(window.sessionStorage[key]));
			} catch(err)
			{
				$rootScope.state.list = [];
			};
			
			return $rootScope.state.list;
		},
		reset: function()
		{
			$rootScope.state.list = []; $rootScope.state.store();
		},
		clear: function()
		{
			$rootScope.state.list = [];
			
			try {
				window.sessionStorage.clear();
			} catch(err) {};
		}
	};
	
	$rootScope.state.store = function()
	{
		var key = 'history_' + window.gid;
		var list = $rootScope.state.list;
		var n = {title: document.title, url: $location.$$url.split('#')[0], ts: Date.now()}; // new location
		var l = list[list.length - 1] || {}; // last location
		var p = list[list.length - 2] || {}; // prev location
		
		if (n.url == p.url)
		{
			list.splice(-1);
		} else if (l.url != n.url) {
			$rootScope.state.list.push(n);
		}
		
		window.sessionStorage[key] = JSON.stringify(angular.copy(list));
	};
	
	$rootScope.state.init(); // ensure there is a place to store
	
	$timeout($rootScope.state.store);
};

app.controller('main', main);

/*
document.addEventListener('swiped-right', function(e)
{
	if ($(e.target).attr('ng-preview')) (function()
	{
		var t = $(e.target).prev();
		
		$(e.target).attr('data-open', 0).removeClass('no-scroll');
		
		if (t) $(t).attr('data-open', 1).addClass('no-scroll');
	})();
});

document.addEventListener('swiped-left', function(e)
{
	if ($(e.target).attr('ng-preview')) (function()
	{
		var t = $(e.target).next();
		
		$(e.target).attr('data-open', 0).removeClass('no-scroll');
		
		if (t) $(t).attr('data-open', 1).addClass('no-scroll');
	})();
});

document.addEventListener('swiped-up', function(e)
{
	if ($(e.target).attr('ng-preview')) (function()
	{
		$(e.target).attr('data-open', 0).removeClass('no-scroll');
	})();
});

document.addEventListener('swiped-down', function(e)
{
	if ($(e.target).attr('ng-preview')) (function()
	{
		$(e.target).attr('data-open', 0).removeClass('no-scroll');
	})();
});
*/
