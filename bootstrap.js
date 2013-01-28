// WTFPL

var Cu = Components.utils;
var Ci = Components.interfaces;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var toggleGIF = function(win) {
	var domWindowUtils = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		.getInterface(Components.interfaces.nsIDOMWindowUtils);

	var animMode = domWindowUtils.imageAnimationMode;
	domWindowUtils.imageAnimationMode = (animMode === 1 ? 0 : 1);
};

var unloaders = [];

function startup(aData, aReason) {
	// Install the new shortcut in all browser windows, current and future
	watchWindows(function togglegif_load(window) {
		try {
			let doc = window.document;
			window.sstogglegif_toggleGIF = toggleGIF;

			let keyset = doc.createElement("keyset");
			keyset.id = "ss-toggle-gif-keyset";

			let key = doc.createElement("key");
			key.id = "ss-toggle-gif-key";
			key.setAttribute("key", "M");
			key.setAttribute("modifiers", "accel");
			key.setAttribute("oncommand", "window.sstogglegif_toggleGIF(content);");
			doc.getElementById("mainKeyset").appendChild(keyset).appendChild(key);
		}
		catch(ex) {}
	},
	function togglegif_unload(window) {
		try {
			let doc = window.document;
			let keyset = doc.getElementById("ss-toggle-gif-keyset");
			if (keyset)
				keyset.parentNode.removeChild(keyset);
			delete window.sstogglegif_toggleGIF;
		}
		catch(ex) {}
	});
}

function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN)
		return;

	unloaders.forEach(function(f) {
		try {
			f();
		} catch (ex) {}
	});
}

function install(aData, aReason) { }

function uninstall(aData, aReason) { }


function watchWindows(callback, uncallback) {
	function forAllLoaded(f) {
		var enumerator = Services.wm.getEnumerator("navigator:browser");
		while (enumerator.hasMoreElements())
			f(enumerator.getNext());
	}

	forAllLoaded(callback);
	unloaders.push(function() {
		forAllLoaded(uncallback);
	});

	var windowWatcher = {
		QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
		observe: function windowWatcherObserve(win, topic, data) {
			win.addEventListener("load", function onLoad(evt) { 
				var win = evt.currentTarget;
				win.removeEventListener("load", onLoad, false);
				if (win.document.documentElement.getAttribute("windowtype") == "navigator:browser")
					callback(win);
			}, false);
		}
	};

	Services.obs.addObserver(windowWatcher, "chrome-document-global-created", false);
	unloaders.push(function() {
		Services.obs.removeObserver(windowWatcher, "chrome-document-global-created", false);
	});
}
