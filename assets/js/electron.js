const fs = require('fs');
const {
	remote,
	ipcRenderer,
	contextBridge,
	webContents,
	ipcMain
} = require('electron');

window.test = function()
{
	// sending message to backend
	ipcRenderer.send('asynchronous-message', {ts: Date.now()});
};


/*
ipcRenderer.on('receive-data-from-main', (event, response) => {
// Display the response from the main process
	console.log(event, response);
});
*/

// backend message frontend relay
ipcRenderer.on('message-to-renderer', (event, eventName, devtoolsContentsId) =>
{
	window.dispatchEvent(new Event(eventName, {
		bubbles: true,
		cancelable: true,
	}));
});




window.addEventListener('enter-full-screen', (event) =>
{
	ipcRenderer.send('asynchronous-message', {type: event.type});
});

window.addEventListener('leave-full-screen', (event) =>
{
	ipcRenderer.send('asynchronous-message', {type: event.type});
});




/*
window.dispatchEvent(new Event('leave-full-screen', {
	bubbles: true,
	cancelable: true,
}));
*/



/*
contextBridge.exposeInMainWorld('api', {
    doAction: arg => ipcRenderer.invoke('an-action', arg)
});
*/



/*
const channel = new BroadcastChannel('backend');

channel.addEventListener('message', (event) =>
{
	console.log(event.data); // Output: "Data to send to another tab"
});
*/

/*
window.addEventListener('backend', (event) =>
{
	console.log('backend event', event.detail); // Output: "Data to send to another tab"
});
*/



/*
window.addEventListener('fullscreenchange', (event) =>
{
	console.log('fullscreenchange', event, document.fullscreenElement);
});
*/





/*
const customEvent = new Event('fullscreenchange', {
	bubbles: true, // The event will bubble up the DOM tree
	cancelable: true, // The event can be canceled
});

// Dispatch the event on the target element
window.dispatchEvent(customEvent);
*/






