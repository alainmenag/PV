var app = angular.module('app', [
	'ngRoute',
	'angularMoment',
	'ngMaterial',
	'ngMessages',
	'xeditable',
	'ngTagsInput',
	'angularSuperGallery'
]);

app.config(function($locationProvider, $routeProvider, $controllerProvider)
{
	window.$routeProvider = $routeProvider;
	window.$controllerProvider = $controllerProvider;
		
	$locationProvider.hashPrefix('!');
	
	$locationProvider.html5Mode({
		enabled: true,
		requireBase: false
	});
});

app.run(function($rootScope, $http, $templateCache, editableOptions, editableThemes) {
	
	editableOptions.theme = 'default';
	editableOptions.blurForm = 'submit';
	editableOptions.blurElem = 'button';
	
	editableThemes['default'].submitTpl = '<button type="submit" class="btn btn-easy btn-round" style="font-size: 12px; margin: 1px; margin-left: 3px;">Set</button>';
	editableThemes['default'].cancelTpl = '<button type="button" class="btn btn-basic btn-round" ng-click="$form.$cancel();" style="font-size: 12px; margin: 1px; margin-left: 3px;">Cancel</button>';

});
