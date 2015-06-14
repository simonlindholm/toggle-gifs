// WTFPL
/*jshint unused:vars, esnext:true, undef:true*/
/*global Components, APP_SHUTDOWN, ADDON_DISABLE, ADDON_UNINSTALL, ADDON_DOWNGRADE*/
/*exported startup, shutdown, install, uninstall*/

// === Constants ===

var Cc = Components.classes;
var Cu = Components.utils;
var Ci = Components.interfaces;

// There is no way to remove frame scripts from cache, so just make the URL unique
// instead. Also use it as a prefix for signals, because the race described in
// https://palant.de/2014/11/19/unloading-frame-scripts-in-restartless-extensions
// seems to be real...
var frameScriptUrl = "chrome://toggle-gifs/content/content.js?" + Date.now();

var MMPrefix = frameScriptUrl + ":";
var PrefBranch = "extensions.togglegifs.";

var {Services} = Cu.import("resource://gre/modules/Services.jsm", {});
var globalMM = Cc["@mozilla.org/globalmessagemanager;1"]
	.getService(Ci.nsIMessageListenerManager);

// === Global state ===

var Prefs = null;
var unloaders = [];

// === Helpers ===

function getWantedGlobalAnimationMode() {
	return Prefs.defaultPaused ? "none" : "normal";
}

function dispatch(signal, data) {
	globalMM.broadcastAsyncMessage(MMPrefix + signal, data);
}

var cancelEvent, keyDownEventToString;

// === Logic ===

function shouldMigrateAnimationOption(version) {
	version = version || "";
	return (version[0] === "0" || version === "1.0"); // <= 1.0
}

function startup(data, reason) {
	var common = Cu.import("chrome://toggle-gifs/content/common.jsm");
	cancelEvent = common.cancelEvent;
	keyDownEventToString = common.keyDownEventToString;
	initPrefs();
	globalMM.addMessageListener(MMPrefix + "browser-init", function(msg) {
		return {prefs: Prefs};
	});
	globalMM.loadFrameScript(frameScriptUrl, true);
}

function shutdown(data, reason) {
	if (reason === APP_SHUTDOWN)
		return;

	unloaders.forEach(function(f) {
		try {
			f();
		} catch (ex) {}
	});

	if (reason === ADDON_DISABLE || reason === ADDON_UNINSTALL ||
		(reason === ADDON_DOWNGRADE && shouldMigrateAnimationOption(data && data.newVersion)))
	{
		var globalAnimMode = Services.prefs.getCharPref("image.animation_mode");
		if (globalAnimMode === getWantedGlobalAnimationMode()) {
			var original = Prefs.originalAnimationMode;
			if (original !== "undefined" && original !== globalAnimMode) {
				// Reset it back the way it was originally.
				Services.prefs.setCharPref("image.animation_mode", original);

				dispatch("set-gif-state", {playing: original === "normal"});
			}
		}
		Services.prefs.getBranch(PrefBranch)
			.setCharPref("originalAnimationMode", "undefined");
	}

	globalMM.removeDelayedFrameScript(frameScriptUrl);
	dispatch("destroy");
	Cu.unload("chrome://toggle-gifs/content/common.jsm");
}

function install(data, reason) {}

function uninstall(data, reason) {}

function handleShortcutKeyDown(event) {
	if (event.which === 8) {
		// Clear on backspace.
		this.value = "";
	}
	else {
		var str = keyDownEventToString(event);
		if (!str)
			return;
		this.value = str;
	}
	this.inputChanged();
	cancelEvent(event);
}

function initPrefs() {
	var defaults = {
		defaultPaused: false,
		showOverlays: true,
		toggleOnClick: false,
		originalAnimationMode: "undefined",
		playOnHover: false,
		hoverPlayOnLoad: false,
		hoverPauseWhen: 1,
		pauseExceptions: "",
		shortcutToggle: "Ctrl+M",
		shortcutReset: "Shift+M",
	};
	var defaultBranch = Services.prefs.getDefaultBranch(PrefBranch);
	var branch = Services.prefs.getBranch(PrefBranch);

	function getOwnPref(key) {
		switch (typeof defaults[key]) {
		case "boolean":
			return branch.getBoolPref(key);
		case "number":
			return branch.getIntPref(key);
		case "string":
			return branch.getCharPref(key);
		}
	}
	function setPref(branch, key, value) {
		switch (typeof defaults[key]) {
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
	function setOwnPref(key, value) {
		setPref(branch, key, value);
		Prefs[key] = value;
	}

	Prefs = {};
	for (var key in defaults) {
		setPref(defaultBranch, key, defaults[key]);
		Prefs[key] = getOwnPref(key);
	}

	if (Prefs.originalAnimationMode === "undefined") {
		// Install time, harmonize the global and local animation prefs.
		setOwnPref("originalAnimationMode", Services.prefs.getCharPref("image.animation_mode"));

		if (Prefs.defaultPaused) {
			// A reinstall/upgrade with paused GIFs; restore the previous pref value.
			var wanted = getWantedGlobalAnimationMode();
			if (Prefs.originalAnimationMode !== wanted)
				Services.prefs.setCharPref("image.animation_mode", wanted);
		}
		else {
			// Either a clean install, or the old value of defaultPaused was false
			// (likely unchanged). Set defaultPaused according to image.animation_mode.
			setOwnPref("defaultPaused", Prefs.originalAnimationMode === "none");
		}
	}

	if (branch.getPrefType("enableShortcuts") && !branch.getBoolPref("enableShortcuts")) {
		branch.setBoolPref("enableShortcuts", true);
		setOwnPref("shortcutToggle", "");
		setOwnPref("shortcutReset", "");
	}

	var prefWatcher = {
		observe: function(subject, topic, key) {
			if (topic !== "nsPref:changed")
				return;
			Prefs[key] = getOwnPref(key);
			if (key === "defaultPaused") {
				// Update the global pref so this actually has an effect.
				// Don't do anything else; this should just affect later page loads.
				Services.prefs.setCharPref("image.animation_mode", getWantedGlobalAnimationMode());
			}
			dispatch("update-pref", {key: key, value: Prefs[key]});
		}
	};

	branch.addObserver("", prefWatcher, false);
	unloaders.push(function() {
		branch.removeObserver("", prefWatcher);
	});

	var uiObserver = {
		observe: function(subject, topic, data) {
			if (data !== "giftoggle@simonsoftware.se")
				return;
			var doc = subject;
			for (let el of doc.getElementsByClassName("togglegifs-shortcut")) {
				if (topic === "addon-options-displayed")
					el.addEventListener("keydown", handleShortcutKeyDown);
				else if (topic === "addon-options-hidden")
					el.removeEventListener("keydown", handleShortcutKeyDown);
			}
		}
	};

	Services.obs.addObserver(uiObserver, "addon-options-displayed", false);
	Services.obs.addObserver(uiObserver, "addon-options-hidden", false);
	unloaders.push(function() {
		Services.obs.removeObserver(uiObserver, "addon-options-displayed");
		Services.obs.removeObserver(uiObserver, "addon-options-hidden");
	});
}
