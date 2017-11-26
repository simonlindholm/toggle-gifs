/* eslint-env browser */
/* global browser */
"use strict";

// Put everything in a closure, to pre-emptively work around
// https://bugzilla.mozilla.org/show_bug.cgi?id=1408996
(function() {

// ==== Constants ====

// Keep in sync with settings.js!
const DefaultPrefs = {
	hoverPauseWhen: 1,
	hoverPlayOnLoad: false,
	indicatorStyle: 0,
	playOnHover: false,
	shortcutReset: "",
	shortcutToggle: "",
	showOverlays: true,
	supportGifv: true,
};

// From http://chrfb.deviantart.com/, licensed under CC by-nc-sa.
const PauseIcon =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAATCAYAAACKsM07AAAAB" +
	"HNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3" +
	"Lmlua3NjYXBlLm9yZ5vuPBoAAACkSURBVDiN5ZQxDsIwDEV/ECNrR6ReJcehc4/BDBdBXXM" +
	"XGLuyxN9SWRrBkroeGAp/+3qynhRbCagkpXQIIRwBYJqmR4zx6eElu5pARDqSA8lBRDovNw" +
	"Wq2pNsSbaq2nt5yb4GSDYftfFyU5BzrqFV3BSIyOKgxf9A8PUdkFwctLgp2P4Tbf+KfmIHI" +
	"96f2OjlpoDkGcBprlcvXyO4ALjN9e7lJS8fua+AWjO1xwAAAABJRU5ErkJggg==";
const PlayIcon =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAATCAYAAACKsM07AAAAB" +
	"HNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3" +
	"Lmlua3NjYXBlLm9yZ5vuPBoAAAF/SURBVDiNtZQxSwNBEIVn9kyfQrRV8DeIhZWdfyCpA6b" +
	"WwtRyBFKI2qQ5mxPigUqaKxIh6QLpBUsRBBELAyEpPJKdc5+NQtDcuYn6YOHY2XvfvhlYog" +
	"R1Op1VACqpbqtEA631ZbvdLrRaraV/AYjIujHmREROm83m9rwATiqEYYiPTwB4IaLr0Wh04" +
	"DjOcy6Xe7MFpLXoc7GILItIwXGcWwD7tVptDUDi5awSBEGApBqArjHmTGsdFovF/m8TfFsi" +
	"shnH8TEz+77vb82VwPO8xAQTMgD6xpgwiqK9Uqn0+vXAQtKf4/HYwp8UES0S0U4mk4mIaNc" +
	"aoLW2AUxqY9rmXwHuiGh/JoBFi0BEfSK6YOay67q9mQBpCQCMlFJdZj6qVCqttFvMA3hkZk" +
	"9rfV6tVp/SzFMBIjJtu6mUKmez2RvXda2G9OMMAMTM/ACgPBgMrur1+kzTT20RgJ5SKhSRw" +
	"yAI7mcxtgF0mbk6HA4bjUYjmsc8Vfl8foVSnhJbvQNA+d4NuYFf9AAAAABJRU5ErkJggg==";
const ResetIcon =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAATCAYAAACKsM07AAAAB" +
	"HNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3" +
	"Lmlua3NjYXBlLm9yZ5vuPBoAAAMsSURBVDiNlZNPaGNVFMa/k5dnzTQkrTgTB7StSFGclSJ" +
	"tM45Q0IXgoCAWcVFRYRYpjqi1dOEiNIjQdopmU2gNJTPdVRelhRbrImRMKVJUtJ3SWbQ7/y" +
	"wUBt740vvnvOOmKUmadNoDZ3Hf+e73u/ecd4GzBa2urnY9SCQiVCgUugAgfFrnpaWlc67rX" +
	"nVd9zqAl5rpCoVCdG1t7arjOB8CuHIqwPLycjcRjYjIG1rrC810i4uLz/q+P0xErzPzow+8" +
	"wcLCwkPhcPgdZv5cRJ4kojAAqdetrKy0HBwcfCAinxljOqp9GwKy2WxLIpF4DkDaWvtq5Ts" +
	"RaQA/V9YzMzPnYrFYj+d5GSJq2LZjgLm5uSdc1x201qYAPF5V+jcUCt0koq8BYH5+/mkReZ" +
	"eZrzHz+WZdqAHkcrnXROQTY8yLAB6uKm07jpMOguD7vb29ci6XG9Rap4joBQBuM/MjwNTUV" +
	"CQSidyw1r4tIo8QER3WAxH5NhKJDO/v7/8Vi8XaEonELWPMy0QUP8m4BuA4zpgxZqi+SES7" +
	"5XL5WiqV8gAgm81mjTFvnsa4BmCtvSJy7OdAEAR3R0dHvQpPa91zFnMACB0CPtVa39Faozq" +
	"NMf2ZTOa9Q60w88fGmD/qdc0SACq9RjqdvgDgSxF5C8BRf0XEBzATCoW+AHDPWtsZDoe/Ep" +
	"FXALSedPpMJkNOZVEsFv8rFotLfX19f4pIFzM/xswUBIEbBEHSWvu87/u7ExMTd/r7+78zx" +
	"njM3MnM55kZjbJUKo059dT19fXfksnkJjO3MPMlZnaYGUEQPAXgcm9v7/3x8fFfS6XST8lk" +
	"8ndmjjLzM8wcqgdsbGyMhRpdbXJy8hfP80aY+brW+p4xBsYYWGsvWWtvVOl+LJfLH1lrR4w" +
	"x9yu6Sh4NuVHMzs7+09bW9o0xpkcp9YNSyldKwRhT82qnp6f/bm9vzyqlLmutbyulykopKK" +
	"Vqh3xSDA0NRX3fHxaR94moM5/PN9w3MDAQb21tHQEwCKAjn8/TsRk0is3NTd3d3V0CsMvMF" +
	"7e2tm410u3s7Kh4PH47Go3etdZe3N7evnka//pTdpxF9z+OKu4QyrEbkgAAAABJRU5ErkJg" +
	"gg==";

const HoverPause = {Never: 0, Next: 1, Unhover: 2, ClickOutside: 3};

const ButtonsMinWidth = 60, ButtonsMinHeight = 40;

const OverlayCss = `
#toggleGifsOverlay, #toggleGifsOverlay * {
   all: initial;
   border: none !important;
   margin: 0 !important;
   padding: 0 !important;
   box-sizing: content-box !important;
}
#toggleGifsOverlay {
   position: absolute !important;
   z-index: 2147483647 !important;
}
#toggleGifsOverlay > #toggleGifsContent {
   position: absolute !important;
   top: 0 !important;
   right: 0 !important;
   max-width: none !important;
   text-align: right !important;
   white-space: nowrap !important;
}
#toggleGifsResetButton, #toggleGifsPauseButton {
   width: 24px !important;
   height: 25px !important;
   display: inline-block !important;
   background-repeat: no-repeat !important;
   background-position: 0 3px !important;
   cursor: pointer !important;
}`;

// Animation state for the document, either "none", "once" or "normal".
// Set upon init, when the parent tells us the right value.
var AnimationBehavior = null;

// ==== Global state ====

var WantedAnimationBehavior = null;
var CurrentHover = null;
var LastToggledImage = null;
var AnimationIndicators = new Set();
var HasInjectedCss = false;
var HasInjectedSvg = false;
var Prefs = null;

// 1 = yes, 2 = waiting.
// No signal for "no", because some requests might never hit the network,
// and some may have done, but have since been evicted from the parent cache.
// A timer could work, I guess, but for now let's try to do without it.
// For simplicity we let this leak without bounds, because it will vanish
// when the tab closes. (An LRU cache would also be an option, but then
// resetImagesInWindow would have to change.)
var AnimatedMap = new Map();

// ==== Expando symbols ====

var eAnimationMode = "toggleGifs-animationMode";
var eCurrentState = "toggleGifs-currentState";
var eCheckedAnimation = "toggleGifs-checkedAnimation";
var eTooSmall = "toggleGifs-tooSmall";
var eShownIndicator = "toggleGifs-shownIndicator";
var eAttachedLoadWaiter = "toggleGifs-attachedLoadWaiter";
var eInitedGif = "toggleGifs-initedGif";
var eRelatedTo = "toggleGifs-relatedTo";
var eFakeImage = "toggleGifs-fakeImage";
var eHandledPinterest = "toggleGifs-handledPinterest";
var ePositionAsIf = "toggleGifs-positionAsIf";

// ==== Helpers ====

// Keep in sync with settings.js!
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

function cancelEvent(event) {
	event.stopPropagation();
	event.preventDefault();
}

// TODO changed signature, double-check callers
function forEachAnimationIndicator(func) {
	for (var el of AnimationIndicators) {
		try {
			func(el);
		} catch (ex) {
			// Let's be defensive.
			AnimationIndicators.delete(el);
			console.error(ex);
		}
	}
}

function inViewport(el) {
	el = el[ePositionAsIf] || el;
	if (el.ownerDocument !== document || !document.contains(el))
		return false;
	if (window.getComputedStyle(el).display === "none")
		return false;
	var re = el.getClientRects()[0];
	return (re && re.bottom > 0 && re.top < window.innerHeight);
}

function isLeftClick(event) {
	return event.which === 1;
}

function isGifv(el) {
	// As of June 2015. Should probably be re-checked...
	if (el.localName !== "video" || !Prefs.supportGifv)
		return false;
	if (el.hasAttribute("muted") && el.hasAttribute("autoplay") &&
		((el.getAttribute("poster") || "").indexOf("i.imgur") !== -1)) {
		// Imgur. imgur.com has its own play indicator on mobile, respect that.
		return (el.ownerDocument.location.host !== "m.imgur.com");
	}
	if (el.hasAttribute("controls"))
		return false;
	if (el.id === "mainVid0" || el.classList.contains("gfyVid")) // gfycat
		return true;
	return el.hasAttribute("muted") && el.hasAttribute("loop") && el.hasAttribute("autoplay");
}

function hasLoaded(el) {
	return isGifv(el) || el.complete;
}

function imageTooSmall(el) {
	var ret = el[eTooSmall];
	if (ret !== undefined)
		return ret;
	if (el.width && el.height)
		ret = (el.width < ButtonsMinWidth || el.height < ButtonsMinHeight);
	else
		ret = (el.offsetWidth < ButtonsMinWidth || el.offsetHeight < ButtonsMinHeight);
	el[eTooSmall] = ret;
	return ret;
}

function resetImageAnimation(img) {
	if (img.tagName === "VIDEO") {
		img.currentTime = 0;
	} else {
		// Funnily enough, the standard guarantees this to work, without side effects:
		// https://html.spec.whatwg.org/multipage/images.html#reacting-to-dom-mutations
		img.src = img.src;
	}
}

function getAnimationState(el) {
	if (el.tagName === "VIDEO") {
		return el.paused ? "none" : "normal";
	} else {
		return el[eCurrentState] || AnimationBehavior;
	}
}

function setAnimationState(el, state) {
	if (el.tagName === "VIDEO") {
		if (state === "normal")
			el.play();
		else
			el.pause();
	} else {
		var currentState = el[eCurrentState] || AnimationBehavior;
		if (currentState === state)
			return;
		el[eCurrentState] = state;
		// TODO
	}
}

function isAnimatedImage(el) {
	if (el.tagName === "VIDEO") {
		return isGifv(el);
	} else {
		return el.tagName === "IMG" && AnimatedMap.has(el.src);
	}
}

// ==== Application logic ====

// ==== Click listeners ====

function onClick(event) {
	if (!isLeftClick(event) || CurrentHover)
		return;
	if (LastToggledImage) {
		setAnimationState(LastToggledImage, "none");
	}
	LastToggledImage = null;
	forEachAnimationIndicator(e => updateIndicator(e, true));
}

function updateClickListeners() {
	var shouldAdd = (Prefs.hoverPauseWhen === HoverPause.ClickOutside);
	if (shouldAdd)
		window.addEventListener("click", onClick);
	else
		window.removeEventListener("click", onClick);
}

// ==== Key listeners ====

function resetImagesInWindow() {
	// (Unfortunately this doesn't reach CSS background images. We could fix
	// that by calling getComputedStyle on *everything*, or by sending URLs of
	// non-<img>s down from the parent, and then doing 'new Image().src = url'.
	// But it's a bit complex.)
	var any = false;
	for (var tagName of ["video", "img"]) {
		for (var el of document.getElementsByTagName(tagName)) {
			if (isAnimatedImage(el)) {
				resetImageAnimation(el);
				any = true;
			}
		}
	}
	return any;
}

function toggleImagesInWindow() {
	var curState = WantedAnimationBehavior;

	// If we've toggled an individual image, and it's still in the viewport,
	// go by that instead of by the global animation mode.
	if (LastToggledImage && inViewport(LastToggledImage) &&
			isAnimatedImage(LastToggledImage)) {
		curState = getAnimationState(LastToggledImage);
	}

	WantedAnimationBehavior = (curState === "none" ? "normal" : "none");

	var any = false;
	for (var tagName of ["video", "img"]) {
		for (var el of document.getElementsByTagName(tagName)) {
			if (isAnimatedImage(el)) {
				setAnimationState(el, WantedAnimationBehavior);
				any = true;
			}
		}
	}

	if (CurrentHover)
		CurrentHover.refresh();
	forEachAnimationIndicator(e => updateIndicator(e, true));

	return any || AnimatedMap.size > 0;
}

function onKeydown(event) {
	if (event.defaultPrevented)
		return;
	var str = keyDownEventToString(event);
	if (!str || !(str === Prefs.shortcutToggle || str === Prefs.shortcutReset))
		return;

	// In case of modifier-less binding, we want to be a bit careful and
	// only cancel the event in case the shortcut actually had an effect.
	var shouldCancel = (event.ctrlKey || event.metaKey || event.altKey);

	if (str === Prefs.shortcutToggle)
		shouldCancel = toggleImagesInWindow() || shouldCancel;

	if (str === Prefs.shortcutReset)
		shouldCancel = resetImagesInWindow() || shouldCancel;

	if (shouldCancel)
		cancelEvent(event);
}

function updateKeyListeners() {
	var shouldAdd = (Prefs.shortcutToggle || Prefs.shortcutReset);
	if (shouldAdd)
		window.addEventListener("keydown", onKeydown);
	else
		window.removeEventListener("keydown", onKeydown);
}

// ==== Overlay ====

function injectOverlayCss() {
	if (HasInjectedCss)
		return;
	HasInjectedCss = true;
	var css = document.createElement("style");
	css.textContent = OverlayCss;
	css.style.display = "none";
	document.documentElement.appendChild(css);
}

function injectIndicatorSvg() {
	if (HasInjectedSvg)
		return;
	HasInjectedSvg = true;

	function cr(name, attrs) {
		var ret = document.createElementNS("http://www.w3.org/2000/svg", name);
		for (var a in attrs)
			ret.setAttribute(a, attrs[a]);
		return ret;
	}

	var svg = cr("svg", {width: "0", height: "0"});
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	svg.style.position = "absolute";
	var defs = cr("defs", {});
	var filter = cr("filter", {
		id: "toggleGifsIndicatorFilter",
		x: "0",
		y: "0",
		width: "100%",
		height: "100%"
	});
	var feImage = cr("feImage", {
		preserveAspectRatio: "xMaxYMin meet",
		width: "100%",
		height: "19",
		y: "3",
		result: "img"
	});
	feImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", PlayIcon);
	var feComposite = cr("feComposite", {operator: "over", in: "img", in2: "SourceGraphic"});
	filter.appendChild(feImage);
	filter.appendChild(feComposite);
	defs.appendChild(filter);
	svg.appendChild(defs);
	document.documentElement.appendChild(svg);
}

function updateIndicator(el, initial = false) {
	void el;
	void initial;
	// TODO
}

function markAnimated(img) {
	if (img[eCheckedAnimation])
		return;
	img[eCheckedAnimation] = true;

	if (WantedAnimationBehavior !== AnimationBehavior)
		setAnimationState(WantedAnimationBehavior);

	// TODO
	img.style.border = "2px solid red";
}

function clearHoverEffect() {
	if (!CurrentHover)
		return;
	var controller = CurrentHover;
	CurrentHover = null;
	controller.clearTimeouts();
	var el = controller.element;
	var overlay = controller.overlay;
	if (overlay && overlay.parentNode)
		overlay.parentNode.removeChild(overlay);
	if (controller.mo)
		controller.mo.disconnect();
	if (Prefs.hoverPauseWhen === HoverPause.Unhover && controller.playing &&
			LastToggledImage === el) {
		LastToggledImage = null;
		setAnimationState(el, "normal");
	}
	updateIndicator(el);
}

function onMouseOver(event) {
	void event;
	// TODO
}

function onMouseOut() {
	// Essentially we want to do clearHoverEffect here if we are currently
	// hovering an animated image. However, the mouseout might be because
	// we hovered over one of the buttons, which we will know in a few
	// milliseconds. Hence this complicated logic.
	// TODO CurrentHoverCancelLoadWaiters(); ?
	if (!CurrentHover || CurrentHover.mouseoutTimeout !== null)
		return;
	try {
		CurrentHover.mouseoutTimeout = window.setTimeout(() => {
			CurrentHover.mouseoutTimeout = null;
			clearHoverEffect();
		}, 50);
	} catch (ex) {
		clearHoverEffect();
	}
}

function updateHoverListeners() {
	addEventListener("mouseover", onMouseOver);
	addEventListener("mouseout", onMouseOut);
}

// ==== Animation detection ====

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

// ==== Initialization ====

function updatePref(pref, value) {
	console.log("updated setting", pref, value);
	Prefs[pref] = value;
	if (pref === "shortcutReset" || pref === "shortcutToggle")
		updateKeyListeners();
	if (pref === "hoverPauseWhen")
		updateClickListeners();
	if (pref === "showOverlays" && !value)
		clearHoverEffect();
	// TODO indicatorStyle
}

function init() {
	// Don't do *anything* if this frame is a dummy frame created by ourselves.
	let fr = window.frameElement;
	if (fr && fr.hasAttribute("toggle-gifs-frame"))
		return;

	let settingsPromise = browser.storage.local.get(DefaultPrefs)
		.then(data => { Prefs = data; })
		.catch(e => {
			throw new Error("unable to read prefs: " + String(e));
		});

	let animationBehaviorPromise = sendMessageWithRetry({type: "query-animation-behavior"})
		.then(behavior => {
			// Assume 'behavior', as just queried from the global pref, is correct
			// for our presContext. This should hold with >99% probability.
			AnimationBehavior = behavior;
			WantedAnimationBehavior = AnimationBehavior;
		});

	let loadedPromise = Promise.all([
		settingsPromise,
		animationBehaviorPromise,
	]);

	var inited = false;
	var loadStartQueue = [];

	settingsPromise.then(() => {
		browser.storage.onChanged.addListener((changes, area) => {
			if (area !== "local")
				return;
			for (var pref in changes) {
				if (pref in DefaultPrefs) {
					let val = changes[pref].newValue;
					if (inited) {
						updatePref(pref, val);
					} else {
						Prefs[pref] = val;
					}
				}
			}
		});
	});

	function onLoadStart(event) {
		var img = event.target;
		if (img.tagName !== "IMG") return;
		if (inited)
			handleLoadStart(img);
		else
			loadStartQueue.push(img);
	}

	document.addEventListener("loadstart", onLoadStart, true);

	loadedPromise.then(() => {
		console.log("content-script init", AnimationBehavior);
		inited = true;

		updateKeyListeners();
		updateClickListeners();
		updateHoverListeners();

		browser.runtime.onMessage.addListener(request => {
			if (request.type === "notify-animated") {
				notifyAnimated(request.url);
			} else {
				throw new Error("unknown request type");
			}
		});

		for (let img of loadStartQueue) {
			try {
				handleLoadStart(img);
			} catch (e) {
				console.error(e);
			}
		}
		loadStartQueue = null;
	});
}

init();

}());
