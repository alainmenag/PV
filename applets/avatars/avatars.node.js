
// ==========================================================================
// NODE - AVATARS
// ==========================================================================

module.exports = function(modules, config)
{
	var exports = {};

// ==========================================================================
// NODE - ADS - API - SEARCH
// ==========================================================================

	//https://medium.com/geekculture/how-to-upload-file-to-aws-s3-using-express-js-922d796245c3

	exports.get = async function(req, res, next)
	{
		return new Promise(resolve =>
		{
			var optionalOverrides = {
				//background: [240, 240, 240, 255],
				background: [0, 0, 0, 0],
				margin:     0.2,
				size:       40,
				saturation: 0.7,
				brightness: 0.5
			};
			
			var svgIdenticon = modules.giticon.default(req.params._id, optionalOverrides);
			
			if (res.end)
			{
				res.writeHead(200, {'Content-Type': 'image/svg+xml'});
								
				res.end(svgIdenticon, 'binary');	
			}
			
			resolve(svgIdenticon);
		});
	};

	modules.exp.get('/cdn/avatars/:_id', exports.get);


// ==========================================================================
// NODE - AVATARS - EXPORTS
// ==========================================================================

	return exports;
};
