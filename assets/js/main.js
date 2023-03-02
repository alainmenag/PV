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
	
	
	
$rootScope.nature1Options = {
    baseUrl: "/cdn/headshots/",
    fields: {
        source: {
            modal: "link",
            image: "medium",
            panel: "thumbnail"
        }
    },
    modal: {
        transition: 'zoomInOut',
        
        thumbnail: {
            height: 50, // thumbnail image height in pixel
            index: false, // show index number on thumbnail
            enabled: true, // enable/disable thumbnails
            dynamic: false, // if true thumbnails visible only when mouseover
            autohide: true, // hide thumbnail component when single image
            click: {
                select: true, // set selected image when true
                modal: false // open modal when true
            },
            hover: {
                preload: true, // preload image on mouseover
                select: false // set selected image on mouseover when true
            },
        },
        
    },
    
    
    thumbnail: {
        height: 250, // thumbnail image height in pixel
        index: false, // show index number on thumbnail
        dynamic: false, // if true thumbnails visible only when mouseover
        autohide: false, // hide thumbnail component when single image
        click: {
            select: true, // set selected image when true
            modal: true // open modal when true
        },
        hover: {
            preload: true, // preload image on mouseover
            select: false // set selected image on mouseover when true
        },
    },
    
    panel: {
        visible: true,
        item: {
            class: 'col-md-3', // item class
            caption: false, // show/hide image caption
            index: false, // show/hide image index
        },
        hover: {
            preload: true, // preload image on mouseover
            select: false // set selected image on mouseover when true
        },
        click: {
            select: false, // set selected image when true
            modal: true // open modal when true
        },
    },
    image: {
        transition: 'slideLR', // transition effect
        transitionSpeed: 0.7, // transition speed 0.7s
        size: 'contain', // contain, cover, auto, stretch
        arrows: {
            enabled: true,  // show/hide arrows
            preload: true, // preload image on mouseover
        },
        click: {
            modal: true // when click on the image open the modal window
        },
        height: null, // height in pixel
        heightMin: null, // min height in pixel
        heightAuto: {
            initial: true, // calculate div height by first image
            onresize: false // calculate div height on window resize
        },
        placeholder: 'panel' // set image placeholder source type (thumbnail) or full url (http...)
    }
};
	
   $rootScope.options1 = {
        //debug: true,
		hashUrl: false,
        baseUrl: "/cdn/headshots/",
        selected: 0,
        fields: {
            source: {
                modal: "link",
                image: "medium",
                panel: "thumbnail"
            }
        },
        //loadingImage: 'preload.svg',
        preloadNext: true,
        preloadDelay: 420,
        autoplay: {
            enabled: false,
            delay: 3200
        },
        //theme: 'darkblue',
        thumbnail: {
            height: 64,
            index: true,
        },
        
        
        modal: {
            caption: {
                visible: true,
                position: 'bottom'
            },
            header: {
                enabled: true,
                dynamic: false
            },
            transition: 'rotateLR',
            //title: "Angular Super Gallery Demo",
            //subtitle: "Nature Wallpapers Full HD",
            thumbnail: {
                height: 77,
                index: true,
            },
        },
        
        
        panel: {
            click: {
                select: false,
                modal: true
            },
            hover: {
                select: true
            },
            items: {
                class: "",
            },
            item: {
                class: "custom",
                title: false
            }
        },


    image: {
        transition: 'slideLR', // transition effect
        transitionSpeed: 0.7, // transition speed 0.7s
        size: 'contain', // contain, cover, auto, stretch
        arrows: {
            enabled: true,  // show/hide arrows
            preload: true, // preload image on mouseover
        },
        click: {
            modal: true // when click on the image open the modal window
        },
        height: 380,
        heightMin: null, // min height in pixel
        heightAuto: {
            initial: true, // calculate div height by first image
            onresize: false // calculate div height on window resize
        },
        placeholder: 'panel' // set image placeholder source type (thumbnail) or full url (http...)
    }


/*
        image: {
            height: 580,
            click: {
                modal: true
            },
            transition: 'zlideLR',
            placeholder: 'panel'
        },
*/
    };

	
	
	
  var imagesBackGroundColor = 'black';

    $rootScope.files1 = [{
            "source": {
                "modal": "ari.jpg",
                //"image": "photo-1462480803487-a2edfd796460?ixlib=rb-1.2.1&auto=format&fit=crop&w=960&q=85",
                //"panel": "photo-1462480803487-a2edfd796460?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=75",
            },
            "title": "Marmolada, Italy",
            "description": "Marco Bonomo",
			'color': imagesBackGroundColor,
			'video': {
				'vimeoId' : '173523597'
			}
        }, {
            "source": {
                "modal": "candice.jpg",
                //"image": "photo-1577951930508-9b26cce01b4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=960&q=85",
                //"panel": "photo-1577951930508-9b26cce01b4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=75",
            },
            "title": "ALEKSEY KUPRIKOV",
            "description": "",
			'color': imagesBackGroundColor,
			'video': {
				'vimeoId' : '137468479'
			}
        }
    ];
	
	
	
	
	
	
	
};

app.controller('main', main);
