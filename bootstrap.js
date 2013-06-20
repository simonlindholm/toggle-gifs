// WTFPL

var Cu = Components.utils;
var Ci = Components.interfaces;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var iterateFrames = function(win, callback) {
	callback(win);
	if (win.frames && win.frames.length) {
		for (var i = 0; i < win.frames.length; ++i)
			iterateFrames(win.frames[i], callback);
	}
};

var toggleGIF = function(topWin) {
	iterateFrames(topWin, function(win) {
		var dwu = win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
		try {
			var animMode = dwu.imageAnimationMode;
			dwu.imageAnimationMode = (animMode === 1 ? 0 : 1);
		} catch (e) {
			// Some invisible iframes don't have presContexts, which breaks
			// the imageAnimationMode getter.
		}
	});
};

var resetGIF = function(topWin) {
	iterateFrames(topWin, function(win) {
		// (Unfortunately this doesn't reach non-<img>s, but I don't see a way around that.)
		var els = win.document.getElementsByTagName("img"), len = els.length;
		for (var i = 0; i < len; ++i) {
			try {
				var el = els[i];
				if (el instanceof Ci.nsIImageLoadingContent) {
					var ic = el.getRequest(Ci.nsIImageLoadingContent.CURRENT_REQUEST).image;
					if (ic.animated) {
						var origMode = ic.animationMode;
						if (origMode) ic.animationMode = 0;
						ic.resetAnimation();
						if (origMode) ic.animationMode = origMode;
					}
				}
			} catch (e) {
				// It's probably not loaded.
			}
		}
	});
};

var unloaders = [];

function startup(aData, aReason) {
	// Install the new shortcut in all browser windows, current and future
	watchWindows(function togglegif_load(window) {
		try {
			let doc = window.document;
			window.sstogglegif_toggleGIF = toggleGIF;
			window.sstogglegif_resetGIF = resetGIF;

			let keyset = doc.createElement("keyset");
			keyset.id = "ss-toggle-gif-keyset";

			let key = doc.createElement("key");
			key.setAttribute("key", "M");
			key.setAttribute("modifiers", "control");
			key.setAttribute("oncommand", "window.sstogglegif_toggleGIF(content);");
			doc.getElementById("mainKeyset").appendChild(keyset).appendChild(key);

			key = doc.createElement("key");
			key.setAttribute("key", "M");
			key.setAttribute("modifiers", "shift");
			key.setAttribute("oncommand", "window.sstogglegif_resetGIF(content);");
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
			delete window.sstogglegif_resetGIF;
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
