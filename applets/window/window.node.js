// ==========================================================================
// NODE - SQUARE
// ==========================================================================

module.exports = function(modules, config)
{
	var exports = {};
	
	modules.cache.windows = modules.cache.windows || {};
		
	exports.app = modules.electron.app;
	
	exports.defaults = {
		debug: false,
		title: 'App.',
		cahce: Date.now(),
		logo: modules.path.join(config.__dirname, 'cdn/oryk-icon.png'),
		logos: {
			'16': modules.path.join(config.__dirname, 'cdn/oryk-icon-16.png'),
			'48': modules.path.join(config.__dirname, 'cdn/oryk-icon-48.png'),
			'64': modules.path.join(config.__dirname, 'cdn/oryk-icon-64.png'),
		},
		backgroundColor: '#000000'
	};
	
	switch (process.platform)
	{
		case 'win32': break;
		
		case 'darwin':
		
			exports.app.dock.hide();
			
			exports.app.dock.setIcon(exports.defaults.logos['64']);
			
			break;
		
		case 'linux': break;
	}
	
// ==========================================================================
// MAIN - WINDOWS
// ==========================================================================

	//https://www.electronjs.org/docs/latest/api/browser-window

	exports.windows = {
		list: {
			main: {
				debug: true || exports.defaults.debug,
				//template: 'file://' + config.__dirname + '/index.html',
				url: 'http://localhost:' + (config.port || process.env.PORT || 5555),
				//template: 'window.html',
				options: {
					width: 1024,
					height: 576,
					center: true,
					minWidth: 420,
					minHeight: 420,
					transparent: true,
					titleBarStyle: 'hiddenInset',
					show: true,
					backgroundColor: exports.defaults.backgroundColor,
					icon: exports.defaults.logo,
					webPreferences: {
						webviewTag: false,
						webSecurity: false,
						nodeIntegration: true,
						contextIsolation: true,
						enableRemoteModule: true,
						allowRunningInsecureContent: true,
						plugins: true,
						//zoomFactor: 1.25,
						zoomFactor: 0,
						textAreasAreResizable: false,
						scrollBounce: false,
						preload: config.__dirname + '/assets/js/electron.js',
					}
				}
			}
		}
	};
	
// ==========================================================================
// MAIN - WINDOWS - SHOW
// ==========================================================================

	exports.windows.show = function(id = null, debug = false)
	{
		if (!exports.app || !exports.app.isReady()) return;
		
		if (!id || !exports.windows.list[id]) return;

		let ref = exports.windows.list[id];
		let instance = modules.cache.windows[id];
		let restore = function()
		{
			if (ref.template) instance.loadFile(ref.template);
			
			if (ref.url) instance.loadURL(ref.url);
			
			instance.show();
			
			instance.focus();
			
			//instance.setFullScreen(true);

			debug = debug || ref.debug;
		
			debug ? instance.webContents.openDevTools() : instance.webContents.closeDevTools();
		};
		
		if (instance) return restore();
		
		instance = new modules.electron.BrowserWindow(ref.options || {});
		
		instance.which = id;
		
		modules.cache.windows[id] = instance;
		
		restore();
		
		instance.on('closed', function()
		{
			delete modules.cache.windows[this.which];
		});
		
		instance.on('enter-full-screen', function()
		{
			instance.webContents.send('message-to-renderer', 'enter-full-screen');
		});
		
		instance.on('leave-full-screen', function()
		{
			instance.webContents.send('message-to-renderer', 'leave-full-screen');
		});
		
		//instance.once('ready-to-show', (a) => {});
	}; exports.windows.show('main');

// ==========================================================================
// MAIN - TRAY
// ==========================================================================

	exports.tray = {
		instance: null,
		tooltip: exports.defaults.title,
		list: {
			main: {
				label: exports.defaults.title,
				click: function()
				{
					exports.windows.show('main');
				}
			},
			debug: {
				label: 'Debug',
				click: function()
				{
					let instance = modules.cache.windows.main;
					
					if (!instance) return exports.windows.show('main', true);
					
					instance.show();
					
					instance.focus();
					
					instance.webContents.openDevTools()
				}
			},
			quit: {
				label: 'Quit',
				accelerator: 'Command+Q',
				selector: 'terminate:'
			}
		}
	};
	
	exports.tray.init = function()
	{
		if (!exports.app || !exports.app.isReady()) return;
		
		modules.cache.tray = modules.cache.tray || (new modules.electron.Tray(exports.defaults.logos['16']));
		
		modules.cache.tray.setToolTip(exports.tray.tooltip || 'App.');
		
		let items = []; for (var id in exports.tray.list) items.push(exports.tray.list[id]);
		let m = modules.electron.Menu.buildFromTemplate(items);
		
		modules.cache.tray.setContextMenu(m);

		exports.app.dock.setMenu(m);
		
	}; exports.tray.init();
	
	if (exports.app) exports.app.on('activate', function() {
		
		//exports.windows.show('main');
		
	});
	
	if (exports.app) exports.app.on('window-all-closed', function() {});
	
	if (exports.app) exports.app.on('ready', function()
	{
		exports.tray.init(); // init on app startup
		
		exports.windows.show('main'); // open window on startup
	});
	
	// open non-localhost links in webbrowser
	if (exports.app) exports.app.on('web-contents-created', (event, contents) =>
	{
		contents.on('will-navigate', (event, navigationUrl) =>
		{
			const parsedUrl = new URL(navigationUrl);
			
			if (parsedUrl.hostname !== 'localhost')
			{
				event.preventDefault();
				
				modules.electron.shell.openExternal(navigationUrl);
			}
		})
	});

// ==========================================================================
// NODE - SQUARE - EXPORTS
// ==========================================================================

	return exports;
};




/*

const { app, BrowserWindow } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

*/
