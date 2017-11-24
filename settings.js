/* eslint-env browser */
/* global browser */
"use strict";

// Keep in sync with content-script.js!
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
let settingsPromise = browser.storage.local.get(defaultSettings)
	.then(data => { settings = data; })
	.catch(err => { console.error(err); });

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

let loadPromise = new Promise(resolve => {
	window.addEventListener("load", resolve, false);
});

let defaultBehaviorPromise =
	browser.browserSettings.imageAnimationBehavior.get({}).then(({value}) => value);

function setPref(pref, value) {
	if (!(pref in settings)) throw new Error("changed unknown pref " + pref);
	settings[pref] = value;
	browser.storage.local.set({ [pref]: value }).catch(console.error);
}

function handleShortcutKeyDown(event) {
	let el = event.target;
	if (event.which === 8) {
		// Clear on backspace.
		el.value = "";
	}
	else {
		let str = keyDownEventToString(event);
		if (!str)
			return;
		el.value = str;
	}

	let pref = el.getAttribute("data-pref"), value = el.value;
	setPref(pref, value);
	event.preventDefault();
	event.stopPropagation();
}

function handleBoolIntChange(event) {
	let el = event.target;
	let pref = el.getAttribute("data-pref"), value = el.checked ? 1 : 0;
	setPref(pref, value);
}

function handleBoolChange(event) {
	let el = event.target;
	let pref = el.getAttribute("data-pref"), value = el.checked;
	setPref(pref, value);
}

function handleRadioChange(event) {
	let el = event.target;
	let pref = el.name, value = el.value;
	setPref(pref, +value);
}

Promise.all([
	loadPromise,
	settingsPromise,
	defaultBehaviorPromise,
]).then(([, , behavior]) => {
	// Special: pause-by-default uses the global animation behavior setting
	let pauseEl = document.getElementById("pause-by-default");
	pauseEl.checked = (behavior === "none");
	pauseEl.onchange = function() {
		let val = this.checked ? "none" : "normal";
		browser.browserSettings.imageAnimationBehavior.set({value: val}).catch(console.error);
	};

	// Radio buttons, currently just with int values
	for (let pref of ["hoverPauseWhen"]) {
		let els = document.getElementsByName(pref);
		let val = settings[pref];
		for (let el of els) {
			if (+el.value === val) el.checked = true;
			el.addEventListener("change", handleRadioChange, false);
		}
	}

	// All other kinds of prefs
	for (let el of document.querySelectorAll("[data-pref]")) {
		let name = el.getAttribute("data-pref");
		let type = el.getAttribute("data-type");
		var pr = settings[name];
		if (type === "shortcut") {
			if (typeof pr !== "string") throw new Error("must be a string pref");
			el.addEventListener("keydown", handleShortcutKeyDown, false);
			el.value = pr;
		} else if (type === "boolint") {
			if (typeof pr !== "number") throw new Error("must be an int pref");
			el.addEventListener("change", handleBoolIntChange, false);
			el.checked = (pr !== 0);
		} else if (el.type === "checkbox") {
			if (typeof pr !== "boolean") throw new Error("must be a bool pref");
			el.addEventListener("change", handleBoolChange, false);
			el.checked = pr;
		} else {
			throw new Error("unrecognized " + name);
		}
	}

	document.body.hidden = false;
});
