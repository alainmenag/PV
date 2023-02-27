var cache = window.cache || null;
var key = window.key || null;
var space = window.space || 'tudays';

var socket = io(window.location.origin, {     // note changed URL here
  path: '/socket.io',
  autoConnect: true,
  transports: ['websocket'],
  //query: window.parseUrl ? window.parseUrl() : {}
});

/*
socket = io.connect('/', {
	secure: false,
	transports: ['websocket'],
	query: {cache: cache, key: null, space: window.space}
});
*/

socket.on('connect', function()
{
	console.log('***** Socket.io:', 'CONNECTED');
	
	socket.ready = true;
	
	window.query = window.parseUrl();
	
	if (window.query && !window.query.cfd) socket.emit('location', window.query);
	
	if (window.query && window.query.cfd) socket.emit('pingpong', window.query);
	
	try {$rootScope.$apply();} catch(err) {};
});

socket.on('connect_error', function(err)
{
	console.log('***** Socket.io:', 'ERROR', err);
	
	socket.ready = true;
	
	try {$rootScope.$apply();} catch(err) {};
});
 
socket.on('disconnect', function()
{
	console.log('***** Socket.io:', 'DISCONNECTED');
	
	try {$rootScope.$apply();} catch(err) {};
});

socket.on('notifications', function(e)
{
	console.log('***** Socket.io:', 'NOTIFCATIONS'); console.log(e);

	if (!$rootScope.query.cfd) $timeout(function()
	{
		$rootScope.notify({memo: e.memo, action: e.action, delay: 0});
	});
});

socket.on('session', function(data)
{
	console.log('***** Socket.io:', 'SESSION', data);
	
	window.session = data;
	
	$rootScope.data.session = window.session;
	
	//$rootScope.load();
	
	$rootScope.$apply();
});

socket.on('user', function(data)
{
	console.log('***** Socket.io:', 'USER', data);
	
	window.user = data;
	
	$rootScope.data.user = window.user;
	
	if (!data) $rootScope.ticket.create();
	
	$rootScope.$apply();
});

socket.on('actions', function(data)
{
	console.log('***** Socket.io:', 'ACTIONS', data);
		
	window.actions = data;
	
	$rootScope.data.actions = window.actions;
	
	$rootScope.$apply();
});

/*
socket.on('tickets', function(ticket)
{
	console.log('***** Socket.io:', 'TICKETS', ticket);
	
	//if ($rootScope.query.cfd) return $rootScope.storage.read({collection: 'tickets', _id: ticket.id}, $rootScope.ticket.load);
	if ($rootScope.query.cfd) {
		$rootScope.data.ticket = ticket; $timeout($rootScope.ticket.scrollDown);
	}
	
	$timeout(function()
	{
		if (!$rootScope.storage.cache.tickets) $rootScope.storage.cache.tickets = {};
		if (!$rootScope.storage.cache.tickets.json) $rootScope.storage.cache.tickets.json = [];
		
		var m = _.find($rootScope.storage.cache.tickets.json, {id: ticket.id});
		
		if (!m) return;
	
		if (ticket.id == data.ticket.id && !ticket.removed) Object.assign(data.ticket, angular.copy(ticket)); // update
	
		if (ticket.removed) // remove
		{
			$rootScope.array.remove(false, $rootScope.storage.cache.tickets.json, m);
		} else if (m) { // swap
			$rootScope.storage.cache.tickets.json[$rootScope.storage.cache.tickets.json.indexOf(m)] = angular.copy(ticket);
		} else { // add
			$rootScope.storage.cache.tickets.json.push(angular.copy(ticket));
		}
	});
});
*/


socket.on('storage', function(payload)
{
	console.log('***** Socket.io:', 'STORAGE', payload);
		
	$timeout(function()
	{
		var preview = $rootScope.query.cfd || (payload.content && payload.content.id == data.ticket.id);
		
		if (payload.collection == 'tickets' && preview)
		{
			data.ticket = angular.copy(payload.content);
			//Object.assign(data.ticket || {}, angular.copy(payload.content));
			
			if ($rootScope.query.cfd) $timeout($rootScope.ticket.scrollDown);
			
			var str = JSON.stringify(data.ticket);
			
			localStorage['ticket'] = str;
		}
		
		if (!$rootScope.storage.cache[payload.collection]) $rootScope.storage.cache[payload.collection] = {};
		if (!$rootScope.storage.cache[payload.collection].json) $rootScope.storage.cache[payload.collection].json = [];
		
		var col = $rootScope.storage.cache[payload.collection].json;
		
		if (payload.content) // update
		{
			var m = _.find(col, {id: payload.content.id});
			
			if (m) { // swap
				col[col.indexOf(m)] = angular.copy(payload.content);
			} else { // add
				col.push(angular.copy(payload.content));
			}
		}
		
		if (payload.removed)
		{
			var m = _.find(col, {id: payload.removed});
			
			$rootScope.array.remove(false, col, m);
		}
	});
});

socket.on('location', function(payload)
{
	console.log('***** Socket.io:', 'LOCATION', payload);
	
	try {
		data.location = payload;
		//data.ads = {count: 0, list: {}};
		
		$rootScope.$apply();
	} catch(err) {};
});

socket.on('pingpong', function(data)
{
	console.log('***** Socket.io:', 'PING PONG', data);
	
	window.query = window.parseUrl();
	
	try {window.query._ticket = $rootScope.data.ticket._id;} catch(err) {};
	
	if (!window.query.cfd) socket.emit('location', window.query);
});

socket.on('ads', function(data)
{
	console.log('***** Socket.io:', 'ADS', data);
	
	if (!window.$rootScope || !window.$timeout) return;
	
	if (!data.length) return $timeout(function() {
		$rootScope.data.ads.count = 0;
		$rootScope.data.ads.list = {};
	});
	
	$rootScope.data.ads.count = 0; $rootScope.$apply();
	
	$timeout(function()
	{
		_.each(data, function(ad)
		{
			$rootScope.data.ads.list[ad._id] = ad;
		});
	
		$rootScope.data.ads.count = Object.keys($rootScope.data.ads.list).length;
	});
});

socket.on('ledger', function(ltx)
{
	console.log('***** Socket.io:', 'LEDGER', ltx);
	
	$rootScope.data.ltx = ltx;
	
	$rootScope.$apply();
});
