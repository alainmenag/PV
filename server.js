/*

root@pos1-N4:~# sudo lpstat -s
no system default destination
device for LabelPrinter242-BT: usb:///LabelPrinter242-BT?serial=LabelPrinter242BT
root@pos1-N4:~#

*/

// ==========================================================================
// TUDAYS - MODUELS
// ==========================================================================

const modules = {
	fs: require('fs'),
	url: require('url'),
    ejs: require('ejs'),
	cookie: require('cookie'),
	path: require('path'),
	http: require('http'),
	_: require('underscore'),
	moment: require('moment'),
	crypto: require('crypto'),
	//watch: require('node-watch'),
	CryptoJS: require('crypto-js'),
	request: require('request'),
    express: require('express'),
	qrSvg: require('qrcode-svg'),
	bodyParser: require('body-parser'),
	formData: require('express-form-data'),
    expsession: require('express-session'),
	cookieParser: require('cookie-parser'),
	ChromecastAPI: require('chromecast-api'),
	xmlparser: require('express-xml-bodyparser'),
	//html_to_pdf: require('html-pdf-node'),
	Datastore: require('nedb'),
	twilio: require('twilio'),
	//admin: require('firebase-admin'),
	redis: require('redis'),
	os: require('os'),
};

try {modules.html_to_pdf = require('html-pdf-node');} catch(err) {};

modules.uuid = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

modules.fs.mkdirSync(__dirname + '/storage', {recursive: true});
modules.fs.mkdirSync(__dirname + '/cdn', {recursive: true});
modules.fs.mkdirSync(__dirname + '/nodes', {recursive: true});
modules.fs.mkdirSync(__dirname + '/logs', {recursive: true});

if (!modules.fs.existsSync('config.json')) modules.fs.writeFileSync('config.json', JSON.stringify({
	created: Date.now(),
	secret: modules.uuid()
}), {flag: 'w'});

var config = require(__dirname + '/config.json');

config.production = process.env.NODE_ENV == 'production';
config.runtime_directory = __dirname + '/';
config.install_directory = __dirname + '/../';
config.storage_directory = __dirname + '/storage';

const { gitToJs } = require('git-parse');

const commitsPromise = gitToJs(__dirname);

commitsPromise.then(function(commits) {
	config.commit = commits[0];
});

// ==========================================================================
// TUDAYS - MODUELS - ADDONS
// ==========================================================================

modules.NedbStore = require('connect-nedb-session')(modules.expsession);
modules.pubSub = modules.redis.createClient();

modules.RedisStore = require('connect-redis')(modules.expsession);

modules.redisClient = modules.redis.createClient({
	host: config.redis && config.redis.host ? config.redis.host : '0.0.0.0'
});

modules.btoa = function(s) {
	
	return typeof s === 'string' ? Buffer.from(s).toString('base64') : null;	
	
};

modules.atob = function(s) {
	
	return typeof s === 'string' ? Buffer.from(s, 'base64').toString('ascii') : null;
	
};

modules.sha1 = function(input) {
    return modules.crypto.createHash('sha1').update(input).digest('hex')
};

modules.sha256 = function(input) {
    return modules.crypto.createHash('sha256').update(input).digest('hex')
};

modules.encrypt = function(value, key = '#*@&#@*&$*#@&$#(')
{
	key = modules.sha256(key);
	value = value || '';
	
	var k = modules.btoa(key);
	var key = modules.CryptoJS.enc.Base64.parse(k);
	//var iv  = modules.CryptoJS.enc.Base64.parse("                ");
	var iv  = modules.CryptoJS.enc.Base64.parse(" ".repeat(key.length));
	var encrypted = modules.CryptoJS.AES.encrypt(value, key, {iv: iv});
	var out = modules.btoa(encrypted.toString());
	
	return out;			
};

modules.decrypt = function(value, key = '#*@&#@*&$*#@&$#(')
{
	var v = null;
	
	try {
		key = modules.sha256(key);
		
		var value = modules.atob(value);
		var k = modules.btoa(key);
		var key = modules.CryptoJS.enc.Base64.parse(k);
		//var iv  = modules.CryptoJS.enc.Base64.parse("                ");
		var iv  = modules.CryptoJS.enc.Base64.parse(" ".repeat(key.length));
		var decrypted = modules.CryptoJS.AES.decrypt(value, key, {iv: iv});
		
		v = decrypted.toString(modules.CryptoJS.enc.Utf8) || null;
	} catch(err) {};
	
	return v;
};


// ==========================================================================
// TUDAYS - HTTP
// ==========================================================================

modules.exp = modules.express();
modules.httpServer = modules.http.createServer(modules.exp);

modules.router = modules.express.Router();
modules.router.map = {};

modules.exp.set('views', __dirname + '/assets/');
modules.exp.set('view engine', 'html');

modules.exp.engine('html', modules.ejs.renderFile);

modules.exp.use('/assets', function(req, res, next)
{
	if (req.url.indexOf('node.js') > -1)
	{
		res.status(404).end();
	} else {
		next();
	}
});

modules.exp.use('/nodes', modules.express.static(__dirname + '/nodes'));
modules.exp.use('/assets', modules.express.static(__dirname + '/assets'));
modules.exp.use('/cdn', modules.express.static(__dirname + '/cdn'));
modules.exp.use('/node_modules', modules.express.static(__dirname + '/node_modules'));

modules.exp.use(modules.formData.parse({
	uploadDir: __dirname + '/tmp',
	autoClean: false
}));

var sess = {
	store: new modules.RedisStore({client: modules.redisClient}),
	//store: new modules.NedbStore({ filename: config.storage_directory+ '/sessions.db' }),
	secret: config.secret,
	saveUninitialized: false,
	resave: true,
	cookie: {
		secure: false,
		httpOnly: false
	}
};



if (true)
{
	modules.exp.set('trust proxy', 1) // trust first proxy
	
	//sess.cookie.secure = true // serve secure cookies
}

modules.sess = sess;
modules.session = modules.expsession(sess);

modules.exp.use(modules.session);
modules.exp.use(modules.cookieParser())
modules.exp.use(modules.formData.format());
modules.exp.use(modules.formData.stream());
modules.exp.use(modules.formData.union());
modules.exp.use(modules.router);

modules.exp.use(modules.bodyParser.urlencoded({
	limit: '50mb',
	extended: true
}));

modules.exp.use(modules.bodyParser.json({
	limit: '50mb',
}));

modules.exp.use(modules.xmlparser());

/*
modules.exp.use(modules.bodyParser.urlencoded({
	extended: true
}));

modules.router.use(modules.bodyParser.json());
*/

modules.exp.use(function (req, res, next)
{
	if (!req.cookies.bid) res.cookie('bid', modules.uuid(), {maxAge: null, httpOnly: false});
	
    if (req.query.sid)
    {
        req.sessionID = req.query.sid;
        
        req.sessionStore.get(req.query.sid, function (err, sess)
        {
            // This attaches the session to the req.
            req.sessionStore.createSession(req, sess || {
	            "cookie": {
		            "originalMaxAge": null,
		            "expires": null,
		            "secure": false,
		            "httpOnly": false,
		            "path": "/"
		        },
		        "sid": req.query.sid
		    });
            
            next();
        })
    } else {
        next();
    }
});

modules.exp.use(function(req, res, next)
{
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', '*');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, _Cookie');
	
	var pathname = req._parsedUrl.pathname;
	
	req.headers.remote = (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0] ? true : false;
	
	if (pathname.indexOf('.') > -1) return next();
	
	if (pathname == '/') pathname = '/home';
	
	//return res.send(config.commit);

	var payload = {
		commit: config.commit || {},
		host: req.headers.host.split(':')[0],
		_hostname: modules.os.hostname(),
		__dirname: __dirname,
		cid: 'formosa123',
		headers: req.headers,
		query: req.query,
		cookies: req.cookies,
		pathname: pathname,
		site: {},
		node: {}
	};
	
	try
	{
		payload.site = JSON.parse(modules.fs.readFileSync(__dirname + '/nodes/' + payload.host + '.json', {
			encoding:'utf8',
			flag:'r'
		}));
	} catch(err) {};
	
	if (payload.site.host && payload.host != payload.site.host) return (function()
	{
		res.writeHead(302, {
			Location: '//' + payload.site.host + (req.url == '/' ? '' : req.url)
		});
		
		res.end();
	})();
	
	try
	{
		payload.node = JSON.parse(modules.fs.readFileSync(__dirname + '/nodes/' + pathname + '.json', {
			encoding:'utf8',
			flag:'r'
		}));
	} catch(err) {};

	//console.log(JSON.stringify(payload));

	res.render(__dirname + '/index.html', payload);
});

modules.httpServer.listen(process.env.PORT || 5555, '0.0.0.0', function(e)
{
	console.log('***** HTTP Listening: ', modules.httpServer._connectionKey);
});

modules.httpServer.on('error', function(e)
{
	console.log('***** HTTP Error:', e.toString());
});

modules.exp.get('/manifest.webmanifest', function(req, res)
{
	var j = {
		short_name: req.headers.host,
		name: req.headers.host,
		background_color: '#000000',
		display: 'standalone',
		theme_color: '#000000'
	};
	
	res.setHeader('content-type', 'application/json');
	
	res.send(j);
});

// ==========================================================================
// TUDAYS - MODUELS EXPORTS
// ==========================================================================

modules['socket.node'] = require(__dirname + '/modules/socket.node.js')(modules, config);

/*
modules['access.node'] = require(__dirname + '/assets/applets/access/access.node.js')(modules, config);
modules['storage.node'] = require(__dirname + '/assets/applets/storage/storage.node.js')(modules, config);
modules['ledger.node'] = require(__dirname + '/assets/applets/ledger/ledger.node.js')(modules, config);
modules['chromecast.node'] = require(__dirname + '/assets/applets/chromecast/chromecast.node.js')(modules, config);
modules['printer.node'] = require(__dirname + '/assets/applets/printer/printer.node.js')(modules, config);
modules['pos.node'] = require(__dirname + '/assets/applets/pos/pos.node.js')(modules, config);
modules['square.node'] = require(__dirname + '/assets/applets/square/square.node.js')(modules, config);
modules['twilio.node'] = require(__dirname + '/assets/applets/twilio/twilio.node.js')(modules, config);
modules['ads.node'] = require(__dirname + '/assets/applets/ads/ads.node.js')(modules, config);
//modules['delivery.node'] = require(__dirname + '/assets/applets/delivery/delivery.node.js')(modules, config);
*/
