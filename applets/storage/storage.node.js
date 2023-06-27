
// ==========================================================================
// NODE - STORAGE
// ==========================================================================

module.exports = function(modules, config)
{
	var exports = {
		db: {
			ads: null,
			skus: null,
			items: null,
			users: null,
			tickets: null,
			notifications: null,
			reviews: null,
		}
	};

// ==========================================================================
// NODE - STORAGE - PATH
// ==========================================================================
	
	exports.path = function(p = '', callback = function() {})
	{
		var storage_directory = config.storage_directory;
		
		return storage_directory + (p || '');
	};

// ==========================================================================
// NODE - STORAGE - INIT
// ==========================================================================

	exports.init = function()
	{
		modules._.each(exports.db, function(o, k)
		{
			exports.db[k] = new modules.Datastore(exports.path('/' + k + '.db'));
			
			exports.db[k].loadDatabase();
		});
	}; exports.init();

// ==========================================================================
// NODE - STORAGE - EXPORTS
// ==========================================================================

	return exports;
};
