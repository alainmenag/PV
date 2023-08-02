app.filter('btoa', function($rootScope) {
	return function(text)
	{
		return btoa(text || '');
	}
});

app.filter('atob', function($rootScope) {
	return function(text)
	{
		return atob(text || '');
	}
});

app.filter('decodeURIComponent', function($rootScope) {
	return function(text)
	{
		return decodeURIComponent(text || '');
	}
});

app.filter('decodeURI', function($rootScope) {
	return function(text)
	{
		return decodeURI(text || '');
	}
});

app.filter('trim', function($rootScope) {
	return function(text, l)
	{
		return (text || '').substr(0, l) + ((text || '').length > l ? '...' : '');
	}
});

app.filter('formatPrice', function($rootScope) {
	return function(num, options)
	{
		options = options || null;
		
		return $rootScope.formatPrice(num, options);
	}
});

app.filter('format12h', function($rootScope) {
	return function(ts, $scope)
	{
		return moment('07/15/1988 ' + ts).format('hh:ss A');
	}
});

app.filter('orderModifiers', function($rootScope) {
	return function(list, $scope)
	{
		list = _.sortBy(list, function(l) {
			
			var MODIFIER_LIST = data.mappings.MODIFIER_LIST[l.modifier_list_id];
			var i = 0; try {
				i = MODIFIER_LIST.modifier_list_data.ordinal;
			} catch(err) {};
			
			return i;
		});
		
		return list;
	}
});

app.filter('toLocaleString', function($rootScope) {
	return function(num, $scope)
	{
		return parseFloat(num).toLocaleString();
	}
});
