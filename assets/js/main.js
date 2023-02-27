var main = function (
	$rootScope,
	$scope,
	$http,
	$filter,
	$location,
	$window,
	$timeout,
	$mdToast,
	$templateCache
) {
	window.$rootScope = $rootScope;
	window.$timeout = $timeout;
	window.$location = $location;
	window.$http = $http;
	
	$rootScope.$ = window.$;
	$rootScope.$rootScope = $rootScope;
	$rootScope.$location = $location;
	$rootScope.Date = window.Date;
	$rootScope._ = window._;
	$rootScope.query = {};
	$rootScope.location = window.location;
	$rootScope.console = window.console;
	$rootScope.confirm = window.confirm;
	$rootScope.alert = window.alert;
	$rootScope.prompt = window.prompt;
	$rootScope.angular = angular;
	$rootScope.$http = $http;
	$rootScope.cache = {};
	$rootScope.socket = window.socket;
	$rootScope._IS_TOUCH = isTouchDevice();
	$rootScope.parseInt = window.parseInt;
	$rootScope.parseFloat = window.parseFloat;
	$rootScope.encodeURIComponent = window.encodeURIComponent;
	
};

app.controller('main', main);
