// WTFPL

var Cc = Components.classes;
var Cu = Components.utils;
var Ci = Components.interfaces;

var {XPCOMUtils} = Cu.import("resource://gre/modules/XPCOMUtils.jsm", {});
var {Services} = Cu.import("resource://gre/modules/Services.jsm", {});

var Prefs = {};

// for debugging
function log(msg) { Cu.reportError(msg); } void(log);

function getIc(el) {
	if (el instanceof Ci.nsIImageLoadingContent)
		return el.getRequest(Ci.nsIImageLoadingContent.CURRENT_REQUEST).image;
	return null;
}

function getDwu(win) {
	return win.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIDOMWindowUtils);
}

function iterateFrames(win, callback) {
	callback(win);
	if (win.frames && win.frames.length) {
		for (var i = 0; i < win.frames.length; ++i)
			iterateFrames(win.frames[i], callback);
	}
}

function toggleGifsInWindow(win) {
	try {
		var dwu = getDwu(win);
		dwu.imageAnimationMode = (dwu.imageAnimationMode === 1 ? 0 : 1);
	} catch (ex) {
		// Some invisible iframes don't have presContexts, which breaks
		// the imageAnimationMode getter.
	}
}

function setGifStateForWindow(win, playing) {
	// Like above.
	try { getDwu(win).imageAnimationMode = playing ? 0 : 1; } catch (ex) {}
}

function resetImageAnimation(el) {
	var ic = getIc(el);
	if (ic && ic.animated) {
		var origMode = ic.animationMode;
		if (origMode) ic.animationMode = 0;
		ic.resetAnimation();
		if (origMode) ic.animationMode = origMode;
	}
}

function resetGifsInWindow(win) {
	// (Unfortunately this doesn't reach non-<img>s, but I don't see a way around that.)
	var els = win.document.getElementsByTagName("img"), len = els.length;
	for (var i = 0; i < len; ++i) {
		try {
			resetImageAnimation(els[i]);
		} catch (ex) {} // not loaded
	}
}

var registeredKeyListeners = new WeakMap();
function addKeyListener(win) {
	var listener = function(ev) {
		if (ev.defaultPrevented || ev.altKey)
			return;
		if (ev.which === 77) { // M
			var targetWin = win.content;
			if (ev.shiftKey && !ev.ctrlKey) {
				iterateFrames(targetWin, resetGifsInWindow);
			}
			else if (ev.ctrlKey && !ev.shiftKey) {
				iterateFrames(targetWin, toggleGifsInWindow);
				ev.stopPropagation();
				ev.preventDefault();
			}
		}
	};

	registeredKeyListeners.set(win, listener);
	win.addEventListener("keydown", listener);
}
function removeKeyListener(win) {
	var listener = registeredKeyListeners.get(win);
	if (listener)
		win.removeEventListener("keydown", listener);
}

var unloaders = [];

function startup(aData, aReason) {
	initPrefs();

	// Hook into all browser windows, current and future.
	watchWindows(function togglegif_load(win) {
		try {
			addKeyListener(win);
		} catch(ex) {}
	},
	function togglegif_unload(win) {
		try {
			removeKeyListener(win);
		} catch(ex) {}
	},
	function togglegif_content_load(win) {
		if (Prefs.defaultPaused)
			setGifStateForWindow(win, false);
	},
	function togglegif_content_unload(win) {
		var initialState = Services.prefs.getCharPref("image.animation_mode");
		setGifStateForWindow(win, initialState === "normal");
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


function forAllWindows(callback, contentCallback) {
	var enumerator = Services.wm.getEnumerator("navigator:browser");
	while (enumerator.hasMoreElements()) {
		var w = enumerator.getNext();
		if (callback)
			callback(w);
		if (!contentCallback)
			continue;
		var gBrowser = w.gBrowser;
		for (var i = 0, len = gBrowser.browsers.length; i < len; ++i) {
			var b = gBrowser.getBrowserAtIndex(i);
			iterateFrames(b.contentWindow, contentCallback);
		}
	}
}

function watchWindows(callback, uncallback, contentCallback, contentUncallback) {
	forAllWindows(callback, contentCallback);
	unloaders.push(function() {
		forAllWindows(uncallback, contentUncallback);
	});

	var windowWatcher = {
		QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
		observe: function windowWatcherObserve(win, topic, data) {
			if (topic === "chrome-document-global-created") {
				win.addEventListener("load", function onLoad() {
					win.removeEventListener("load", onLoad, false);
					if (win.document.documentElement.getAttribute("windowtype") == "navigator:browser")
						callback(win);
				}, false);
			}
			else if (topic === "content-document-global-created") {
				contentCallback(win);
			}
		}
	};

	Services.obs.addObserver(windowWatcher, "chrome-document-global-created", false);
	Services.obs.addObserver(windowWatcher, "content-document-global-created", false);
	unloaders.push(function() {
		Services.obs.removeObserver(windowWatcher, "content-document-global-created");
		Services.obs.removeObserver(windowWatcher, "chrome-document-global-created");
	});
}

function initPrefs() {
	function getPref(branch, key) {
		return branch.getBoolPref(key); // everything is a bool currently
	}
	function setPref(branch, key, value) {
		switch (typeof value) {
		case "boolean":
			branch.setBoolPref(key, value);
			break;
		case "number":
			branch.setIntPref(key, value);
			break;
		case "string":
			branch.setCharPref(key, value);
			break;
		}
	}

	var defaults = {
		defaultPaused: false,
	};
	var PrefBranch = "extensions.togglegifs.";
	var defaultBranch = Services.prefs.getDefaultBranch(PrefBranch);
	var branch = Services.prefs.getBranch(PrefBranch);
	for (var key in defaults) {
		setPref(defaultBranch, key, defaults[key]);
		Prefs[key] = getPref(branch, key);
	}

	var prefWatcher = {
		observe: function(subject, topic, key) {
			if (topic !== "nsPref:changed")
				return;
			Prefs[key] = getPref(branch, key);
			if (key === "defaultPaused") {
				// Don't update anything; this should just affect later page loads.
			}
		}
	};

	branch.addObserver("", prefWatcher, false);
	unloaders.push(function() {
		branch.removeObserver("", prefWatcher);
	});
}
