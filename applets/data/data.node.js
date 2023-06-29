
// ==========================================================================
// NODE - DATA
// ==========================================================================

module.exports = function(modules, config) {
				
	var exports = {};
	
	exports.count = async function(options, callback = function() {})
	{
		return new Promise(resolve =>
		{
			var done = function(r)
			{
				resolve(r); callback(r);
			};
			
			options.cursor.count(function(err, c) {
				done(c);
			});
		});
	};
	
	exports._id = async function(collection, id, callback = function() {})
	{
		var collection = modules.mongo[collection];
			
		return new Promise(resolve =>
		{
			var done = function(doc = {})
			{
				var _id = doc?._id.toString();
				
				callback(_id); resolve(_id);
			};
			
			if (!collection) return done();
	
			collection.findOne({id: id}, function(err, doc)
			{
				done(doc);
			});
		});
	};
	
	exports.list = async function(payload, options)
	{
		var _id = await exports._id(options.collection, payload.params._id);
			
		return new Promise(resolve =>
		{
			var collection = modules.mongo[options.collection];
			
			if (!collection) return resolve();
			
			var query = {category: options.category, owners: _id || payload.params._id};
			
			collection.find(query, null, {
				limit: options.length || options.limit || 0,
				sort: options.sort
			}, function(err, docs)
			{
				resolve(docs);
			});
		});
	};
	
	exports.find = async function(options, callback = function() {})
	{
		var collection = modules.mongo[options.collection];
		var query = {deleted: null};
		var sort = {};
		var owners = [];
			
		query['category'] = options.category;
		query['$and'] = [];

		if (options.uid) query['$and'].push({'$or': [
			{'_id': new modules.mongodb.ObjectId(options.uid)},
			{'owners': options.uid},
			{'members': options.uid}
		]});
			
		if (options.search && options.search.value)
		{
			var $or = [];
			
/*
			try {
				$or.push({
					_id: new modules.mongodb.ObjectId(options.search.value)
				})
			} catch(err) {};
*/
			
			
			////{'title': new RegExp(options.search.value, "i")}
			
			
			for (
				var i = 0; i < options.columns.length; i++
			)
			{
				var c = options.columns[i];
				
				if (c.searchable && c.data == '_id')
				{
					try
					{
						$or.push({
							_id: new modules.mongodb.ObjectId(options.search.value)
						});
					} catch(err) {};
					
					continue;
				}
				
				//if ($or.length) break; // searching by id
				
				var s = {};
				
				s[c.data] = new RegExp(options.search.value, "i"); // search by given coln name
				
				$or.push(s);
			}
						
			if ($or.length) query['$and'].push({'$or': $or});
		}
		
		if (options.order) for (
			var i = 0; i < options.order.length; i++
		)
		{
			var s = options.order[i];
			var c = options.columns[s.column];
			
			sort[c.data] = s.dir == 'desc' ? -1 : 1;
		}
		
		if (!query['$and'].length) delete query['$and'];
				
		var count = await exports.count({cursor: collection.find(query)});

		return new Promise(resolve =>
		{
			var done = function(data)
			{
				resolve(data); callback(data);
			};

			var cursor = collection.find(query)
				.sort(sort)
				.skip(options.start || 0)
				.limit(options.length || 0);
			
			cursor.toArray(function (err, docs, c)
			{
				done({
					'data': docs,
			        'recordsFiltered': count,
			        'recordsTotal': docs.length
				});
			});
		});
	};

// ==========================================================================
// NODE - ADS - API - SEARCH
// ==========================================================================

	//https://medium.com/geekculture/how-to-upload-file-to-aws-s3-using-express-js-922d796245c3

	async function onData(req, res, next)
	{
		var uid = req.session.profile && req.session.profile._id;
		var ts = Date.now();
		
		if (!uid) return res.end(); // must be logged in
		
		// search documents
		if (req.body.search) return (function()
		{
			Object.assign(req.body, req.query);
			Object.assign(req.body, {uid: uid});
			
			exports.find(req.body, function(data)
			{
				res.send(data);
			});
		})();
		
		var collection = modules.mongo[req.query.collection]; if (!collection) return res.end();
		
		// convert a custom ID to mongo _id
		if (!req.body._id && req.body.id)
		{
			req.body._id = await exports._id(req.query.collection, req.body.id);
		}
		
		//console.log(req.body); return res.end();

		// insert document
		if (!req.body._id && Object.keys(req.body).length) return (function()
		{
			if (!collection) return res.end();
			
			req.body._id = new modules.mongodb.ObjectId();
			req.body.id = req.body.id || req.body._id.toString();
			req.body.owners = [uid];
			req.body.category = req.query.category;
			req.body.created = Date.now();

			return modules.mongo.profiles.findAndModify({
				query: {_id: req.body._id},
				update: {$set: req.body},
				upsert: true,
				new: true
			}, function (err, doc, lastErrorObject)
			{
				if (!doc && !err) err = 'Update failed.';
				
				res.send({data: doc, err: err?.toString()});
			});

			res.end();
		})();
		
		// update document
		if (req.body._id)
		{
			var collection = modules.mongo[req.query.collection];
			var _id = new modules.mongodb.ObjectId(req.body._id);
			
			if (!collection) return res.end();
			
			for (const k in req.body)
			{
				var v = req.body[k];
				
				if ((new RegExp('data.*base64')).test(v)) // parse file as attachment
				{
					req.body[k] = null; // clear out large value
					
					var d = v.split(';base64,');
					var t = d[0].split(':').pop();
					var key = [req.body._id, k].join('_');
					
					try // upload to s3
					{
						const command = new modules.s3.PutObjectCommand({
							Bucket: "main",
							Key: key, 
							Body: Buffer.from(d[1], 'base64'),
							ContentEncoding: 'base64',
							ContentType: t,
							ACL: 'public-read',
							ObjectAttributes: [req.body._id, 'public-read']
						});
					
						var response = await modules.s3.send(command);
						
						req.body[k] = config.s3.url + key + '?' + ['ts=' + Date.now()].join('&');
						
					} catch(err) {};
					
					if (!req.body[k]) try // store to local cdn folder
					{
						await modules.exec.execSync('rm -rf /opt/oryk/cdn/' + key + '.*') // remove old key file
						
						key = key + '.' + modules.mime.extension(t);
						
						req.body[k] = req.headers.origin + '/cdn/' + key + '?' + ['ts=' + Date.now()].join('&');
						
						modules.fs.writeFileSync('/opt/oryk/cdn/' + key, Buffer.from(d[1], 'base64'), 'buffer');

					} catch(err) {};
					
					// make profile attachment entry
				}
			}

			delete req.body._id;
			
			if (req.body['deleted']) req.body['deleted'] = ts;
			if (req.body['deactivated']) req.body['deactivated'] = ts;
			
			var query = {_id: _id, $or: []};
			
			query['$or'].push({owners: uid}); // if the editor owns the doc
			query['$or'].push({_id: (new modules.mongodb.ObjectId(uid))}); // if the editor owns the doc
			
			req.body.updated = Date.now();
			
			//console.log(req.body); return res.end();
			
			return modules.mongo.profiles.findAndModify({
				query: query,
				update: {$set: req.body},
				upsert: false,
				new: true
			}, function (err, doc, lastErrorObject)
			{
				if (doc) modules.pubSub.emit(req.query.collection, doc);
				
				res.send({data: doc});
			});
			
			return res.end();
		}
		
		res.end();
	}

	modules.exp.post('/api/data', onData);

// ==========================================================================
// NODE - DATA - EXPORTS
// ==========================================================================

	return exports;
};
