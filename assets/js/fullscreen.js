//document.fullscreenEnabled
//document.fullscreenElement
//fullscreenchange;fullscreenerror

//document.documentElement.requestFullscreen();
//document.exitFullscreen();

/*
var elem = $('html');

if (elem.requestFullscreen)
{
	elem.requestFullscreen();
} else if (elem.webkitRequestFullscreen)
{ // Safari
	elem.webkitRequestFullscreen();
} else if (elem.msRequestFullscreen) { //IE11
	elem.msRequestFullscreen();
}
*/

app.run(function($rootScope, $http, $templateCache, editableOptions, editableThemes)
{
	$rootScope.fullscreen = {
		active: document.fullscreenElement ? true : false
	};
	
	$rootScope.fullscreen.open = function()
	{
		document.documentElement.requestFullscreen();
		
		window.dispatchEvent(new Event('enter-full-screen', {
			bubbles: true,
			cancelable: true,
		}));
	};
	
	$rootScope.fullscreen.close = function()
	{
		if (document.fullscreenElement) document.exitFullscreen();
		
		window.dispatchEvent(new Event('leave-full-screen', {
			bubbles: true,
			cancelable: true,
		}));
	};

//==========================================================================
// CART - LISTENERS
//==========================================================================

	window.addEventListener('fullscreenchange', (event) =>
	{
		window.dispatchEvent(new Event(document.fullscreenElement ? 'enter-full-screen' : 'leave-full-screen', {
			bubbles: true,
			cancelable: true,
		}));
	});

	window.addEventListener('enter-full-screen', (event) =>
	{
		$timeout(function()
		{
			$rootScope.fullscreen.active = true;
		});
	});

	window.addEventListener('leave-full-screen', (event) =>
	{
		$timeout(function()
		{
			$rootScope.fullscreen.active = false;
		});
	});
});

/*
    const remote = require("electron").remote;

    document.addEventListener("keydown", event => {

        switch (event.key) {
            case "Escape":
                if (remote.getCurrentWindow().isFullScreen()) {
                    remote.getCurrentWindow().setFullScreen(false);
                }
                break;
             }
    });
*/
