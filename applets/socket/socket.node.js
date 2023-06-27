
// ==========================================================================
// NODE - SOCKET
// ==========================================================================

module.exports = function(modules, config) {
				
	var exports = {fresh: true, on: {}};

	if (modules['socket.node'] && modules['socket.node'].io)
	{
		exports = modules['socket.node'];
		
		exports.io.off('connection', exports.on.connection);
	}
	
	exports.fresh = exports.io ? false : true;
	
// ==========================================================================
// NODE - SOCKET - POLICY
// ==========================================================================
	
	exports.policy = ''
		+ '<?xml version="1.0"?>\n<!DOCTYPE cross-domain-policy SYSTEM \n"http://www.adobe.com/xml/dtds/cross-domain-policy.dtd">\n<cross-domain-policy>\n'
		+ '<site-control permitted-cross-domain-policies="master-only"/>\n'
		+ '<allow-access-from domain="*" to-ports="*"/>\n'
		+ '</cross-domain-policy>\n';
	
// ==========================================================================
// NODE - SOCKET - IO
// ==========================================================================

	if (exports.fresh) exports.io = require('socket.io')(modules.httpServer);
	
	if (exports.fresh) exports.io.use(function(socket, next) {
	    modules.session(socket.request, socket.request.res || {}, next);
	});
	
// ==========================================================================
// NODE - SOCKET - IO - ON CONNECTION
// ==========================================================================
	
	exports.on.connection = function(client)
	{
		var cookies = modules.cookie.parse(client.request.headers.cookie || '');
		
		client.handshake.ip = client.handshake.headers['x-forwarded-for'] || client.handshake.address.split(':').pop();

		if (client.handshake.ip) client.join(client.handshake.ip);
		if (client.request.session.sid) client.join(client.request.session.sid);
		if (client.handshake.query.space) client.join('_' + client.handshake.query.space);
		if (client.handshake.query.key) client.join(client.handshake.query.key);
		if (client.request.sessionID) client.join(client.request.sessionID);
		if (cookies.bid) client.join(cookies.bid);
		
		client.on('message', function(payload) {});
		
		client.on('disconnect', function() {});
	};
	
	exports.io.on('connection', exports.on.connection);

// ==========================================================================
// NODE - SOCKET - EXPORTS
// ==========================================================================

	return exports;
};
