function isTouchDevice() {
  return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0));
}

//==========================================================================
// RETINA
//==========================================================================

function isRetinaDisplay() {
    if (window.matchMedia) {
        var mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
        return (mq && mq.matches || (window.devicePixelRatio > 1)); 
    }
}

//==========================================================================
// PAD
//==========================================================================

function pad(d) {
	return (d < 10) ? '0' + d.toString() : d.toString();
}

function padd(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


// ==========================================================================
// RESOLVE PARENT
// ==========================================================================

function resolveParent(obj, path, dataName) {
	
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
		//obj[key].itemNumberCount = key + '_' + new Date().getTime();
		if (dataName) obj[key].dataName = dataName;
	}
	
	return obj;
  
}

window.parseUrl = function(href)
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
};



// ==========================================================================
// SET JSON VALUE
// ==========================================================================

function setJsonValue(path, val, obj) {
	
	var fields = path.split('.');
	var result = obj;
	
	for (var i = 0, n = fields.length; i < n && result !== undefined; i++) {
		
		var field = fields[i];
		
		if (i === n - 1) {
			result[field] = val;
		} else {
			if (typeof result[field] === 'undefined' || typeof result[field] != 'object') {
				result[field] = {};
			}
			result = result[field];
		}
		
	}
	
	return obj;
  
}
