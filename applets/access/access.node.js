
// ==========================================================================
// NODE - ACCESS
// ==========================================================================

module.exports = function(modules, config)
{
	var exports = {};
	
	exports.encode = async function(password, secret = null, callback = function() {})
	{
		return new Promise(resolve =>
		{
			var done = function(r) {
				resolve(r); callback(r);
			};
			
			modules.crypto.pbkdf2(password, (secret || config.secret || config.created), 310000, 32, 'sha256', function(err, hashedPassword)
			{
				done(err ? null : hashedPassword.toString('hex'));
			});
		});
	};
	
	/*
	modules.crypto.pbkdf2('Jump2Cuba@2', (config.secret || config.created), 310000, 32, 'sha256', function(err, hashedPassword) {
		console.log(hashedPassword.toString('hex'));
	});
	*/

// ==========================================================================
// NODE - ACCESS - PASSPORT
// ==========================================================================

	modules.passport.serializeUser(function(user, done) {
		done(null, user);
	});
	
	modules.passport.deserializeUser(function(user, done) {
		done(null, user);
	});

// ==========================================================================
// NODE - ACCESS - PASSPORT - BASIC AUTH.
// ==========================================================================

	modules.passport.use(new modules.LocalStrategy(function verify(username, password, cb)
	{
		exports.encode(password, null, function(password)
		{
			if (!password) return cb(null, false, {
				message: 'Invalid credentials.'
			});
			
			var q = {category: 'users'};
			
			q['aliases.' + modules.btoa(username) + '.access_token'] = password;

			// ATTEMPT WITH CACHE
			modules.mongo.profiles.findOne(q, function(err, profile)
			{
				if (profile && profile.blocked) return cb(null, false, {
					message: 'The profile is blocked. Please contact support.'
				});
				
				if (profile) return cb(null, {
					uid: profile._id
				});
				
				cb(null, false, {
					message: 'Incorrect username or password.'
				});
			});
		});
	}));

// ==========================================================================
// NODE - ACCESS - API - LOGIN
// ==========================================================================

	modules.exp.post('/api/access/login', function(req, res, next)
	{
		var strategy = req.query.strategy || req.body.strategy;
		var successRedirect = '/account?';
		var failureRedirect = '/access/login?';
		
		var search = [];
		
		if (req.body.redirect)
		{
			successRedirect = req.body.redirect;
			
			search.push('redirect=' + encodeURIComponent(req.body.redirect));
		}
		
		failureRedirect += search.join('&');
		
		if (req.body.username && req.body.password && req.body.signup) return (function()
		{
			modules['profiles.node'].create(req.body.username, {
				password: req.body.password
			}, function(r)
			{
				if (r && r.err) return (function()
				{
					req.flash('error', r.err);
					
					res.redirect(failureRedirect);
				})();

				modules.passport.authenticate(
				    'local', {
						successRedirect: successRedirect,
						failureRedirect: failureRedirect,
						failureFlash: true
					}
				) (req, res, next);
			});
		})();

		modules.passport.authenticate(
		    strategy, {
				successRedirect: successRedirect,
				failureRedirect: failureRedirect,
				failureFlash: true
			}
		) (req, res, next);
	});

	modules.exp.get('/access/login', function(req, res)
	{
		res.render('../applets/access/access.html', {
			query: req.query,
			config: config,
			session: req.session
		});
		
		if (req.session.flash && req.session.flash['error'] && req.session.flash['error'].length) // erase info messages for next load
		{
			req.session.flash['error'] = [];
			
			req.session.save();
		}
	});

	modules.exp.get('/api/access/logout', function(req, res)
	{
		req.session.destroy(() => {
			res.redirect('/account');
		});
	});
	
	modules.exp.delete('/api/access/messages', function(req, res)
	{
		var index = req.query.index ? parseInt(req.query.index) : null;
		var type = req.query.type;
		
		if (req.session.flash[type] && !isNaN(index)) req.session.flash[type].splice(index, 1);
		
		res.send({});
	});
	
	


	modules.exp.get('/api/access/login/:_id', function(req, res, next)
	{
		var _id = req.params._id; // target user
		var pass = req.session?.passport;
		var user = pass ? pass.user : null; // current user
		
		var done = function(location) {
			res.redirect(location || req.headers.referer || '/account');
		};
		
		if (!_id || !user) return done(); // must have a targte & be logged in
		
		// requesting to login as themseleves
		if (user.uid == _id) return (function()
		{
			req.flash('warning', 'You cannot login as yourself.');
			
			done();
		})();
		
		// requesting to revert to owner
		if (_id == user.owner) return (function()
		{
			req.session.passport.user.uid = user.owner;
			req.session.passport.user.owner = null;
			
			done('/services/team');
		})();
		
		// check db for access allowed
		modules.mongo.profiles.findOne({
			_id: (new modules.mongodb.ObjectId(_id)),
			owners: user.uid // if current logged in user has ownership over the given user
		}, function(err, profile)
		{
			if (profile)
			{
				req.session.passport.user.owner = user.uid;
				req.session.passport.user.uid = _id;	
				
				req.flash('info', 'You\'re now logged in as: ' + (profile.title || _id)); done('/account');
			} else {
				req.flash('warning', 'Login failed.'); done('/services/team');
			}
		});
	});
	

/*
	modules.router.mount({
		node: 'access.node',
		id: '34k5j3kl4jsdi345345fsaccessassume',
		method: 'get',
		path: '/api/access/login/:_id',
		callback: function(req, res, next)
		{
			var _id = req.params._id; // target user
			var pass = req.session?.passport;
			var user = pass ? pass.user : null; // current user
			var done = function() {
				res.redirect(req.headers.referer || '/account');
			};
			
			if (!_id || !user) return done();
			
			// revert to owner
			if (_id == user.owner) return (function()
			{
				req.session.passport.user.uid = user.owner;
				req.session.passport.user.owner = null;
				
				done();
			})();
			
			if (user.uid == _id)
			{
				req.flash('error', 'You cannot login as yourself.');
			} else {
				req.session.passport.user.owner = user.uid;
				req.session.passport.user.uid = _id;
			}

			done();
		}
	});
*/


// ==========================================================================
// NODE - ACCESS - EXPORTS
// ==========================================================================

	return exports;
};
