function isTouchDevice() {
  return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0));
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
