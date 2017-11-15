/* eslint-env browser */
/* global browser */
"use strict";

console.log("toggle-gifs content script", window);

// 1 = yes, 2 = waiting.
// No signal for "no", because some requests might never hit the network,
// and some may have done, but have since been evicted from the parent cache.
// A timer could work, I guess, but for now let's try to do without it.
// For simplicity we let this leak without bounds, because it will vanish
// when the tab closes. (An LRU cache would also be an option.)
var animatedMap = new Map();

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
	var url = img.src, key = hash(url), v = animatedMap.get(key);
	if (v === 1) {
		markAnimated(img);
	} else if (v !== 2) {
		animatedMap.set(key, 2);
		browser.runtime.sendMessage({type: "query-animated", url})
			.catch(console.error);
	}
}

function onLoadStart(event) {
	var img = event.target;
	if (img.tagName !== "IMG") return;
	checkAnimated(img);
}

function init() {
	let fr = window.frameElement;
	if (fr && fr.hasAttribute("toggle-gifs-frame"))
		return;

	document.addEventListener("loadstart", onLoadStart, true);

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
}

init();
