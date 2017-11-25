/* eslint-env browser */
/* global browser */
"use strict";

// Put everything in a closure, to pre-emptively work around
// https://bugzilla.mozilla.org/show_bug.cgi?id=1408996
(function() {

// Keep in sync with settings.js!
const defaultSettings = {
	hoverPauseWhen: 1,
	hoverPlayOnLoad: false,
	indicatorStyle: 0,
	playOnHover: false,
	shortcutReset: "",
	shortcutToggle: "",
	showOverlays: true,
	supportGifv: true,
};
let settings = null;

function keyDownEventToString(event) {
	function keyToString(ev) {
		let {which, key} = ev;
		if (which === 27)
			return "Esc";
		if (which === 32)
			return "Space";
		if (which === 13)
			return "Enter";
		if (which < 32)
			return null;
		return (key.length === 1 ? key.toUpperCase() : key);
	}
	function accelToString(ev) {
		var accel = "";
		if (ev.ctrlKey) accel += "Ctrl+";
		if (ev.metaKey) accel += "Meta+";
		if (ev.shiftKey) accel += "Shift+";
		if (ev.altKey) accel += "Alt+";
		return accel;
	}
	var key = keyToString(event), accel = accelToString(event);
	return key ? accel + key : "";
}
// end keep in sync

var AnimationBehavior = null; // "none", "once" or "normal"

// 1 = yes, 2 = waiting.
// No signal for "no", because some requests might never hit the network,
// and some may have done, but have since been evicted from the parent cache.
// A timer could work, I guess, but for now let's try to do without it.
// For simplicity we let this leak without bounds, because it will vanish
// when the tab closes. (An LRU cache would also be an option.)
var AnimatedMap = new Map();

function updatePref(pref, value) {
	// XXX support all prefs here, or just a subset?
	// indicatorStyle might require special handling
	console.log("updated setting", pref, value);
	settings[pref] = value;
}

// Needed due to https://bugzilla.mozilla.org/show_bug.cgi?id=1369841.
function sendMessageWithRetry(msg) {
	function rec(attempt, dur) {
		return browser.runtime.sendMessage(msg)
			.catch(e => {
				if (dur >= 5000)
					throw new Error("Failed to talk to background script even after retries: " + String(e));
				if (attempt === 0)
					console.warn("Unable to talk to background script; bug 1369841? Retrying.");
				return new Promise(r => {
					setTimeout(() => {
						r(rec(attempt + 1, dur * 2));
					}, dur);
				});
			});
	}
	return rec(msg, 0, 20);
}

function hash(url) {
	// Poor man's hash function. Probably good enough for uniqueness purposes,
	// but suboptimally long.
	if (url.length <= 250)
		return url;
	return url.substr(0, 240) + url.substr(-10) + url.length;
}

function toggleGifs() {
	console.log("toggle gifs", window);
	// TODO
}

function resetGif(img) {
	// Funnily enough, the standard guarantees this to work, without side effects:
	// https://html.spec.whatwg.org/multipage/images.html#reacting-to-dom-mutations
	img.src = img.src;
}

function resetGifs() {
	console.log("reset gifs", window);
	for (var img of document.getElementsByTagName("img"))
		resetGif(img);
}

function markAnimated(img) {
	if (img.toggleGifsHasCheckedAnimation)
		return;
	img.toggleGifsHasCheckedAnimation = true;

	img.style.border = "2px solid red";
}

function notifyAnimated(url) {
	console.log("found animated gif", url);
	for (var img of document.getElementsByTagName("img")) {
		if (img.src === url)
			markAnimated(img);
	}
}

function checkAnimated(img) {
	var url = img.src, key = hash(url), v = AnimatedMap.get(key);
	if (v === 1) {
		markAnimated(img);
	} else if (v !== 2) {
		AnimatedMap.set(key, 2);
		browser.runtime.sendMessage({type: "query-animated", url})
			.catch(e => console.error(e));
	}
}

function handleLoadStart(img) {
	checkAnimated(img);
}

function init() {
	// Don't do *anything* if this frame is a dummy frame created by ourselves.
	let fr = window.frameElement;
	if (fr && fr.hasAttribute("toggle-gifs-frame"))
		return;

	let settingsPromise = browser.storage.local.get(defaultSettings)
		.then(data => { settings = data; })
		.catch(e => {
			throw new Error("unable to read settings: " + String(e));
		});

	let animationBehaviorPromise =
		sendMessageWithRetry({type: "query-animation-behavior"});

	let loadedPromise = Promise.all([
		settingsPromise,
		animationBehaviorPromise,
	]);

	var hasLoaded = false;
	var loadStartQueue = [];

	settingsPromise.then(() => {
		browser.storage.onChanged.addListener((changes, area) => {
			if (area !== "local")
				return;
			for (var prop in changes) {
				if (prop in defaultSettings) {
					let val = changes[prop].newValue;
					if (hasLoaded) {
						updatePref(prop, val);
					} else {
						settings[prop] = val;
					}
				}
			}
		});
	});

	function onLoadStart(event) {
		var img = event.target;
		if (img.tagName !== "IMG") return;
		if (hasLoaded)
			handleLoadStart(img);
		else
			loadStartQueue.push(img);
	}

	document.addEventListener("loadstart", onLoadStart, true);

	loadedPromise.then(([, behavior]) => {
		console.log("content-script init", behavior);
		hasLoaded = true;

		// Assume 'behavior', as just queried from the global pref, is correct
		// for our docshell. This should hold with >99% probability.
		AnimationBehavior = behavior;

		browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
			void sendResponse;
			if (request.type === "toggle-gifs") {
				toggleGifs();
			} else if (request.type === "reset-gifs") {
				resetGifs();
			} else if (request.type === "notify-animated") {
				notifyAnimated(request.url);
			} else {
				throw new Error("unknown request type");
			}
		});

		for (let img of loadStartQueue) {
			handleLoadStart(img);
		}
		loadStartQueue = null;
	});
}

init();

}());
