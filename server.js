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
	cache: {},
	binders: {},
	fs: require('fs'),
	url: require('url'),
    ejs: require('ejs'),
	cookie: require('cookie'),
	path: require('path'),
	http: require('http'),
	_: require('underscore'),
	moment: require('moment'),
	crypto: require('crypto'),
	pg: require('pg'),
	//watch: require('node-watch'),
	CryptoJS: require('crypto-js'),
	request: require('request'),
	flash: require('connect-flash'),
	got: require('got'),
    express: require('express'),
    mustache: require('mustache'),
	mongodb: require('mongodb'),
	mongojs: require('mongojs'),
	mime: require('mime-types'),
	MongoDataTable: require('mongo-datatable'),
	qrSvg: require('qrcode-svg'),
	bodyParser: require('body-parser'),
	fileUpload: require('express-fileupload'),
	exec: require('child_process'),
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
	passport: require('passport'),
	LocalStrategy: require('passport-local'),
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
config.__dirname = __dirname;
config.runtime_directory = __dirname + '/';
config.install_directory = __dirname + '/../';
config.storage_directory = __dirname + '/storage';

/*
const { gitToJs } = require('git-parse');

const commitsPromise = gitToJs(__dirname);

commitsPromise.then(function(commits) {
	config.commit = commits[0];
});
*/

process.on('uncaughtException', function(err) {
	
	console.log('***** uncaughtException:', err.toString());
        
});

// ==========================================================================
// TUDAYS - MODUELS - STORAGE BUCKET
// ==========================================================================

//https://www.npmjs.com/package/@aws-sdk/client-s3

const {S3Client, AbortMultipartUploadCommand, ListObjectsCommand, PutObjectCommand} = require('@aws-sdk/client-s3');

modules.s3 = new S3Client(config.s3);

modules.s3.ListObjectsCommand = ListObjectsCommand;
modules.s3.PutObjectCommand = PutObjectCommand;

// ==========================================================================
// TUDAYS - MODUELS - REDIS
// ==========================================================================

modules.NedbStore = require('connect-nedb-session')(modules.expsession);
modules.pubSub = modules.redis.createClient();

modules.RedisStore = require('connect-redis')(modules.expsession);

modules.redisClient = modules.redis.createClient({
	host: config.redis && config.redis.host ? config.redis.host : '0.0.0.0',
	legacyMode: true,
});

modules.redisClient.getAsync = async function(key)
{
	return new Promise(resolve =>
	{
		modules.redisClient.get(key, function(r, d)
		{
			var json = null; try {
				json = JSON.parse(d);
			} catch(err) {};
			
			resolve(json || d);
		});
	});
};

modules.pubSub.on('error', function(err) {
	
	console.log('***** Redis Error:', err.toString());
	
});

// ==========================================================================
// TUDAYS - MODUELS - MQTT
// ==========================================================================

modules.mqtt = require('mqtt').connect('mqtt://' + (config.mqtt && config.mqtt.host ? config.mqtt.host : '0.0.0.0'));

//modules.mqtt = require('mqtt').connect('mqtt://' + '0.0.0.0');

modules.mqtt.on('connect', function()
{
	console.log('***** MQTT: connect:', Date.now());
	
	modules.mqtt.subscribe('presence', function(err)
	{
		if (!err) modules.mqtt.publish('presence', 'Hello mqtt');
	});
});

modules.mqtt.on('offline', function()
{
	console.log('***** MQTT: offline:', Date.now());
});

modules.mqtt.on('message', function(topic, message)
{
	console.log('***** MQTT: message:', Date.now(), message.toString())
});

// ==========================================================================
// TUDAYS - MODUELS - MONGO
// ==========================================================================

/*
modules.mongocli = new modules.mongodb.MongoClient([
	'mongodb:/',
	(config.mongodb && config.mongodb.host ? config.mongodb.host : '0.0.0.0')
].join('/'));
*/

modules.mongo = new modules.mongojs([
	'mongodb:/',
	(config.mongodb && config.mongodb.host ? config.mongodb.host : '0.0.0.0'),
	'production'
].join('/'), [
	'profiles'
]);

modules.mongo.on('connect', function() {
	console.log('***** Mongo: connect:', Date.now());
})

modules.mongo.on('error', function(err) {	
	console.log('***** Mongo: error:', err);	
});

modules.mongo.stats(function(err, r) {});

// ==========================================================================
// TUDAYS - MODUELS - ADDONS
// ==========================================================================

modules.btoa = function(s) {
	
	return typeof s === 'string' ? Buffer.from(s).toString('base64') : null;	
	
};

modules.atob = function(s) {
	
	return typeof s === 'string' ? Buffer.from(s, 'base64').toString('ascii') : null;
	
};

modules.sha1 = function(input) {
    return modules.crypto.createHash('sha1').update(input).digest('hex');
};

modules.md5 = function(input) {
    return input ? modules.crypto.createHash('md5').update(input).digest('hex') : null;
};

modules.sha256 = function(input) {
    return modules.crypto.createHash('sha256').update(input).digest('hex');
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




modules.renderView = async function(template, options)
{
	return new Promise(resolve =>
	{
		modules.exp.render(template, options, function(e, t)
		{
			resolve(t);
		});
	});
};


modules.resolveParent = function(obj, path, dataName) {
	
	var parts = path.split(/[.]/g);
	var parent;
	var obj;
	
	try {
		obj = JSON.parse(obj);
	} catch(err) {};
	
	for (var i = 0; i < parts.length && obj; i++) {
		var p = parts[i];
		if (p in obj) {
			parent = obj;
			obj = obj[p];
		} else {
			return undefined;
		}
	}
	
	for (key in obj) {
		obj[key].itemNumberCount = key + '_' + new Date().getTime();
		if (dataName) obj[key].dataName = dataName;
	}
	
	return obj;
  
};


modules.router = modules.express.Router();
modules.router.map = {};

modules.router.unmount = function(options = {})
{
	// remove any http routes
	modules._.each(modules._.filter(modules.router.stack, {
		node: options.key
	}), function(route)
	{
		modules.router.stack.splice(modules.router.stack.indexOf(route), 1);
		
	});
};

modules.router.mount = function(options) {
	
	options = options || {};
	
	if (!options.path) return;

	for (var i = 0; i < modules.router.stack.length; i++) {
		
		var stack = modules.router.stack[i];
		
		if (
			(stack.route && stack.route.path == options.path)
			|| (stack.id && stack.id == options.id)
		) modules.router.stack.splice(i, 1);
	
	}
	
	if (options.method) modules.router[options.method](options.path, options.callback);
	
	if (options.methods) for (var i = 0; i < options.methods.length; i++) {
		
		modules.router[options.methods[i]](options.path, options.callback);
		
	}
	
	if (options.id) (function() {
		
		var stack = modules._.filter(modules.router.stack, function(r) {		
			return r.route && r.route.path == options.path;	
		});
		
		stack[0].id = options.id;
		stack[0].node = options.node;
		
	})();

};

// ==========================================================================
// TUDAYS - HTTP
// ==========================================================================

modules.exp = modules.express();
modules.httpServer = modules.http.createServer(modules.exp);



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

modules.exp.use(['/node_modules', '/cdn'], function(req, res, next)
{
	res.set({
	    "Cache-Control": "public, max-age=86400",
	    "Expires": new Date(Date.now() + 86400000).toUTCString()
	});
	
	next();
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

modules.exp.use(modules.flash());

modules.exp.use(function(req, res, next)
{
/*
    res.locals.successes = req.flash('success');
    res.locals.dangers = req.flash('danger');
    res.locals.warnings = req.flash('warning');
    res.locals.error = req.flash('error');
*/
    
    next();
});

modules.exp.use(modules.bodyParser.urlencoded({
	limit: '50mb',
	extended: true,
	parameterLimit: 1000000
}));

modules.exp.use(modules.bodyParser.json({
	limit: '50mb',
	extended: true,
	parameterLimit: 1000000
}));

modules.exp.use(modules.xmlparser());

// Note that this option available for versions 1.0.0 and newer. 
modules.exp.use(modules.fileUpload({
    useTempFiles : true,
    tempFileDir : '/opt/oryk/tmp/'
}));

/*
modules.exp.use(modules.bodyParser.urlencoded({
	extended: true
}));

modules.router.use(modules.bodyParser.json());
*/

/*
const cors = require('cors');
modules.exp.use(cors({
   origin: ['https://www.sendinviteto.com', 'https://www.sendinviteto.com/'],
   methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH', 'HEAD']
}));
*/

modules.exp.get('/', function(req, res, next)
{
	if (req.headers.accept && req.headers.accept.indexOf('image/') === 0) return res.end();

	next();
});


modules.exp.get('*.js.map', function(req, res, next) // ignore 404 maps if not in assets
{
	res.end();
});

modules.exp.use(function(req, res, next)
{
	if (req._parsedUrl.pathname.indexOf('.') > -1) return next();
	
	if (req.headers.accept && req.headers.accept.indexOf('text/html') == -1) return next();
	
	if (!req.session.passport || !req.session.passport.user) return next();
	
	req.session.uid = req.session.passport.user.uid;
	
	var _id = new modules.mongodb.ObjectId(req.session.passport.user.uid);
	
	modules.mongo.profiles.findOne({
		_id: _id,
		blocked: {$exists: false}
	}, function(err, profile)
	{
		if (!profile) return (function()
		{
			req.session.passport = {};
			req.session.profile = null;
			
			req.flash('error', 'Failed to load your profile. Please try to login or contact support.');
			
			res.redirect('/access/login');
		})();
		
		if (profile) req.session.profile = profile;
		
		req.session.save();
	
		next();
	});
});




modules.exp.get('/creator', function(req, res, next)
{

	if (req.query.img) return (function() {
	
	res.header('Access-Control-Allow-Origin', 'https://www.sendinviteto.com');
	res.header('Access-Control-Allow-Methods', '*');
	res.header('Access-Control-Allow-Credentials', '*');
	res.header('Access-Control-Allow-Headers', '*');
	
	res.setHeader('Content-Type', 'image/svg+xml');
	
	modules.fs.createReadStream(__dirname + '/nodes/creator/postcard-stripe.svg').pipe(res);
	
	})();

	next();
});



modules.exp.get('/maps/api/place/photo', function(req, res)
{
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', '*');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, _Cookie');
	
	req.pipe(modules.request({
		url: 'https://maps.googleapis.com' + req.url
	})).pipe(res);
});

modules.exp.use(function(req, res, next)
{
	if (!req.cookies.bid) res.cookie('bid', modules.uuid(), {maxAge: null, httpOnly: false});
	
    if (req.query.sid)
    {
        req.sessionID = req.query.sid;
        
        req.sessionStore.get(req.query.sid, function(err, sess)
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
	var pathname = req._parsedUrl.pathname;
	var host = req.headers.host;
	var hostname = req.headers.hostname; // override host in headers
	var location = req.headers.location; // override location in headers
	
	// remove trailing slashes
	if (pathname.length > 1 && pathname.slice(-1) == '/') return (function()
	{	
		res.writeHead(302, {
			Location: pathname.slice(0, -1) + (req._parsedUrl.search || '')
		});
		
		res.end();
	})();
	
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', '*');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, _Cookie');
	
	req.headers.remote = (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0] ? true : false;

	req.site = {}; try
	{
		req.site = JSON.parse(modules.fs.readFileSync(__dirname + '/nodes/' + host + '.json', {
			encoding:'utf8',
			flag:'r'
		}));
	} catch(err)
	{
		req.site = {};
	};
	
	req.site.routes = req.site.routes || {};
	
	// redirect if site host do not match
	if (req.site.host && host != req.site.host) return (function()
	{
		res.writeHead(302, {
			Location: '//' + req.site.host + (req.url == '/' ? '' : req.url)
		});
		
		res.end();
	})();

	next();
});




modules.exp.get('/qr/:qr', function(req, res, next)
{
	if (req.site && req.site.qr && req.site.qr[req.params.qr])
	{
		var options = req.site.qr[req.params.qr] || {};
		
		res.writeHead(302, {
			Location: options.redirect || '/'
		});
		
		return res.end();
	}

	next();
});


/*
modules.exp.use(function(req, res, next)
{
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', '*');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, _Cookie');
	
	next();
});
*/

// ==========================================================================
// TUDAYS - MODUELS EXPORTS
// ==========================================================================

modules['access.node'] = require(__dirname + '/applets/access/access.node.js')(modules, config);
modules['data.node'] = require(__dirname + '/applets/data/data.node.js')(modules, config);
modules['profiles.node'] = require(__dirname + '/applets/profiles/profiles.node.js')(modules, config);
modules['storage.node'] = require(__dirname + '/applets/storage/storage.node.js')(modules, config);
modules['socket.node'] = require(__dirname + '/applets/socket/socket.node.js')(modules, config);
modules['services.node'] = require(__dirname + '/applets/services/services.node.js')(modules, config);

modules['square.node'] = require(__dirname + '/applets/square/square.node.js')(modules, config);
modules['oryk.node'] = require(__dirname + '/applets/oryk/oryk.node.js')(modules, config);
modules['pos.node'] = require(__dirname + '/applets/pos/pos.node.js')(modules, config);


modules.pubSub.subscribe('profiles');

modules.pubSub.on('profiles', function(d) {modules['oryk.node'].provision(d);});

/*
modules['access.node'] = require(__dirname + '/assets/applets/access/access.node.js')(modules, config);
modules['ledger.node'] = require(__dirname + '/assets/applets/ledger/ledger.node.js')(modules, config);
modules['chromecast.node'] = require(__dirname + '/assets/applets/chromecast/chromecast.node.js')(modules, config);
modules['printer.node'] = require(__dirname + '/assets/applets/printer/printer.node.js')(modules, config);
modules['pos.node'] = require(__dirname + '/assets/applets/pos/pos.node.js')(modules, config);
modules['square.node'] = require(__dirname + '/assets/applets/square/square.node.js')(modules, config);
modules['twilio.node'] = require(__dirname + '/assets/applets/twilio/twilio.node.js')(modules, config);
modules['ads.node'] = require(__dirname + '/assets/applets/ads/ads.node.js')(modules, config);
//modules['delivery.node'] = require(__dirname + '/assets/applets/delivery/delivery.node.js')(modules, config);
*/






modules.exp.get('/preload.svg', function(req, res)
{
	var data = modules.fs.readFileSync(__dirname + '/assets/vendor/SVG-Loaders-master/svg-loaders/audio.svg', 'utf8');
	
	res.send(data);
});



async function render(req, callback = function() {})
{
	var payload = {
		modules: modules,
		_hostname: modules.os.hostname(),
		__dirname: __dirname,
		host: req.headers.host.split(':')[0],
		remote: (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0] ? true : false,
		commit: config.commit || {},
		headers: req.headers,
		query: req.query,
		body: req.body,
		params: req.params,
		session: req.session,
		cookies: req.cookies,
		pathname: req._parsedUrl.pathname == '/' ? '/home' : req._parsedUrl.pathname,
		site: req.site || {},
		cid: 'abc112233',
		render: 'html',
		data: {}
	};
	
	if (req.method == 'POST') payload.render = 'json';
	
	if (req.query.render) payload.render = req.query.render;
	
	if (payload.pathname.indexOf('/@') === 0)
	{
		payload.params._id = payload.pathname.split('/@').pop().split('/')[0] || req.session.uid;
		payload.pathname = '/profile';
	}
	
	if (!payload.node) try
	{
		payload.node = JSON.parse(modules.fs.readFileSync(__dirname + '/nodes/' + payload.pathname + '.json', {
			encoding:'utf8',
			flag:'r'
		}));
	} catch(err) {};
	
	if (!payload.node) try
	{
		payload.node = JSON.parse(modules.fs.readFileSync(__dirname + '/routes/' + payload.pathname + '.json', {
			encoding:'utf8',
			flag:'r'
		}));
	} catch(err) {};
	
	if (!payload.node && req.site.routes[payload.pathname]) try
	{
		payload.node = JSON.parse(modules.fs.readFileSync(__dirname + req.site.routes[payload.pathname], {
			encoding:'utf8',
			flag:'r'
		}));
	} catch(err) {};

	payload.node = payload.node || {};
	payload.node.data = payload.node.data || {};

/*
	// This lets you get a single dataset from another module
	if (payload.node.data && modules[payload.node.data.src]) try
	{
		var o = payload.node.secure && payload.node.secure[payload.node.data.config];
		var fn = modules.resolveParent(modules[payload.node.data.src], payload.node.data.fn);
		
		payload.node.data[payload.node.data.key || 'payload'] = await fn(payload, o);
	} catch(err) {};

	// This allows a single HTTP resource to load
	if (payload.node.data && payload.node.data.src && payload.node.data.src.indexOf('http') === 0) try
	{
		var output = modules.mustache.render(payload.node.data.src, payload);
		var d = await modules.got(output, {json: true});
    
		payload.node.data[payload.node.data.key] = d.body;
		
	} catch(err)
	{
		payload.node.data[payload.node.data.key] = {};
	};
*/
	
	// This allows a list of resources to load
	if (payload.node.resources) for (var k in payload.node.resources)
	{
		var d = null;
		var o = payload.node.resources[k];
		
		if (o.src.indexOf('http') === 0)
		{
			try {
				d = await modules.got(modules.mustache.render(o.src, payload), {json: true});
			}
			catch(err) {};
		} else if (o.src.indexOf('.node') > -1)
		{
			try {
				var fn = modules.resolveParent(modules[o.src], o.fn);
				
				d = {body: await fn(payload, o)};
			}
			catch(err) {};
		}
		
		payload.node.data[o.key] = d && d.body;
	};
	
	delete payload.node.secure;
	
	if (payload.render == 'json')
	{
		payload.template = await modules.renderView(__dirname + '/body.html', payload);	
	} else
	{
		payload.template = await modules.renderView(__dirname + '/index.html', payload);
	}
	
	delete payload.modules;
	
	callback(payload.render == 'json' ? {payload: payload} : payload.template);	
};


async function main(req, res, next)
{
	if (
		req._parsedUrl.pathname.indexOf('.') > -1
		&& req._parsedUrl.pathname.indexOf('@') == -1
	) return next();
	
	render(req, function(r)
	{
		res.send(r);
		
		if (req?.session?.flash?.info?.length) req.session.flash['info'] = [];
		if (req?.session?.flash?.warning?.length) req.session.flash['warning'] = [];
		
		req.session.save();
	});
};


modules.exp.use(main);









modules.httpServer.listen(config.port || process.env.PORT || 5555, '0.0.0.0', function(e)
{
	console.log('***** HTTP: listening:', modules.httpServer._connectionKey);
});

modules.httpServer.on('error', function(e)
{
	console.log('***** HTTP: error:', e.toString());
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





















modules.deleteModule = function(moduleName) {
	
	var solvedName = null; try {
		solvedName = require.resolve(moduleName);
	} catch(err) {};
	
	if (!solvedName) return;
	
	var nodeModule = require.cache[solvedName];

	if (nodeModule) {

		for (
			var i = 0; i < nodeModule.children.length; i++
		) modules.deleteModule(nodeModule.children[i].filename);
		
		delete require.cache[solvedName];
		
	}
	
};


modules.reloadScript = function(p, load) {
	
	if (load == undefined) load = true;
	
	var key = p.split('/').pop().split('.js')[0];
	
	if (key.substr(0, 1) == '.') return;
	
	console.log('***** Nodes:', p);
	
	modules.router.unmount({key: key});
	
/*
	// remove any http routes
	modules._.each(modules._.filter(modules.router.stack, {node: key}), function(route) {
		
		modules.router.stack.splice(modules.router.stack.indexOf(route), 1);
		
	});
*/

	try {
	
		modules.deleteModule(p);
		
		if (load) modules[key] = require(p)(modules, config);
		
		if (!load) (function() {
			
			delete modules[key];
			
			var routes = modules._.filter(modules.router.stack, {node: key});

			for (
				var i = 0; i < routes.length; i++
			) if (
				modules.router.stack.indexOf(routes[i]) > -1
			) modules.router.stack.splice(modules.router.stack.indexOf(routes[i]), 1);

		})();
		
		//if (!modules.router.map[p]) modules.router.map[p] = {};
		
	} catch(err) {
	
		console.log('***** Nodes:', err);
		
	};
	
};

const chokidar = require('chokidar');
const { exec, spawn } = require('node:child_process');


try
{
	chokidar.watch(__dirname + '/applets/*/*.node.js', {
		ignoreInitial: true,
		persistent: true,
		awaitWriteFinish: {
			stabilityThreshold: 50,
			pollInterval: 50
		},
		ignorePermissionErrors: false,
		atomic: true
	}).on('all', (event, path) =>
	{
		exec('fuser ' + path, (err, stdout, stderr) =>
		{
			if (!stdout) modules.reloadScript(path);
		});
	});
}
catch(err) {};
