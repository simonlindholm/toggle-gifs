// WTFPL. Injected into relevant browsers as a frame script.
/*jshint esnext:true, unused:true, undef:true*/
/*global Components, content, addEventListener, removeEventListener,
  addMessageListener, removeMessageListener, sendSyncMessage*/

(function() {

// === Constants ===

var Cc = Components.classes;
var Cu = Components.utils;
var Ci = Components.interfaces;

var elService = Cc["@mozilla.org/eventlistenerservice;1"]
	.getService(Ci.nsIEventListenerService);

var prefService = Cc["@mozilla.org/preferences-service;1"]
	.getService(Ci.nsIPrefBranch);

// From http://chrfb.deviantart.com/, licensed under CC by-nc-sa.
var PauseIcon =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAATCAYAAACKsM07AAAAB" +
	"HNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3" +
	"Lmlua3NjYXBlLm9yZ5vuPBoAAACkSURBVDiN5ZQxDsIwDEV/ECNrR6ReJcehc4/BDBdBXXM" +
	"XGLuyxN9SWRrBkroeGAp/+3qynhRbCagkpXQIIRwBYJqmR4zx6eElu5pARDqSA8lBRDovNw" +
	"Wq2pNsSbaq2nt5yb4GSDYftfFyU5BzrqFV3BSIyOKgxf9A8PUdkFwctLgp2P4Tbf+KfmIHI" +
	"96f2OjlpoDkGcBprlcvXyO4ALjN9e7lJS8fua+AWjO1xwAAAABJRU5ErkJggg==";
var PlayIcon =
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
var ResetIcon =
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

var HoverPause = {Never: 0, Next: 1, Unhover: 2, ClickOutside: 3};

var ButtonsMinWidth = 60, ButtonsMinHeight = 40;

var OverlayCss = [
	"#toggleGifsOverlay, #toggleGifsOverlay * {",
		"all: initial;", // Fx27+
		"border: none !important;",
		"margin: 0 !important;",
		"padding: 0 !important;",
		"-moz-box-sizing: content-box !important;",
	"}",
	"#toggleGifsOverlay > style {",
		"display: none !important;",
	"}",
	"#toggleGifsOverlay {",
		"position: absolute !important;",
		"z-index: 2147483647 !important;",
	"}",
	"#toggleGifsOverlay > #toggleGifsContent {",
		"position: absolute !important;",
		"top: 0 !important;",
		"right: 0 !important;",
		"text-align: right !important;",
		"white-space: nowrap !important;",
	"}",
	"#toggleGifsResetButton, #toggleGifsPauseButton {",
		"width: 24px !important;",
		"height: 25px !important;",
		"display: inline-block !important;",
		"background-repeat: no-repeat !important;",
		"background-position: 0 3px !important;",
		"cursor: pointer !important;",
	"}",
].join("\n");

// === Global state ===

// It would be okay to have this per document, but I'm lazy.
var CurrentHover = null;
var individuallyToggledImages = new WeakMap();
var animationIndicators = new WeakMap();
var AddonIsEnabled = true;
var Prefs = null;

// === Expando symbols ===

var eNoMoreGifIndicators = "toggleGifs-noMoreGifIndicators";
var eHasHovered = "toggleGifs-hasHovered";
var eAttachedLoadWaiter = "toggleGifs-attachedLoadWaiter";
var eInitedGif = "toggleGifs-initedGif";
var eRelatedTo = "toggleGifs-relatedTo";
var eFakeImage = "toggleGifs-fakeImage";
var eHandledPinterest = "toggleGifs-handledPinterest";
var ePositionAsIf = "toggleGifs-positionAsIf";

// === Helpers ===

var {cancelEvent, keyDownEventToString} =
	Cu.import("chrome://toggle-gifs/content/common.jsm", {});

function getDwu(win) {
	return win.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIDOMWindowUtils);
}

function getIc(el) {
	if (isGifv(el)) {
		return {
			animated: true,
			get animationMode() {
				return el.paused ? 1 : 0;
			},
			set animationMode(state) {
				if (state === 0)
					el.play();
				else
					el.pause();
			},
			resetAnimation: function() {
				el.currentTime = 0;
			}
		};
	}
	if (el instanceof Ci.nsIImageLoadingContent)
		return el.getRequest(Ci.nsIImageLoadingContent.CURRENT_REQUEST).image;
	return null;
}

function setGifStateForWindow(win, playing) {
	try {
		getDwu(win).imageAnimationMode = playing ? 0 : 1;

		var videos = win.document.getElementsByTagName("video");
		for (var i = 0, len = videos.length; i < len; ++i) {
			var ic = getIc(videos[i]);
			if (ic && ic.animated)
				ic.animationMode = playing ? 0 : 1;
		}
	} catch (ex) {} // missing presContexts and so on
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

function forEachAnimationIndicator(doc, callback) {
	var indicators = animationIndicators.get(doc);
	if (!indicators)
		return;
	for (var el of indicators)
		callback(el);
}

function hasEventListenerOfType(el, type) {
	var listeners = elService.getListenerInfoFor(el, {});
	for (var i = 0; i < listeners.length; i++) {
		var li = listeners[i];
		if (li.type === type && li.listenerObject)
			return true;
	}
	return false;
}

function hasLoaded(el) {
	return isGifv(el) || el.complete;
}

function inViewport(win, el) {
	el = el[ePositionAsIf] || el;
	if (el.ownerDocument !== win.document || !win.document.contains(el))
		return false;
	if (win.getComputedStyle(el).display === "none")
		return false;
	var re = el.getClientRects()[0];
	return (re && re.bottom > 0 && re.top < win.innerHeight);
}

function isLeftClick(event) {
	return event.which === 1;
}

function isGifv(el) {
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

function imageTooSmall(el) {
	if (el.width && el.height)
		return (el.width < ButtonsMinWidth || el.height < ButtonsMinHeight);
	return (el.offsetWidth < ButtonsMinWidth || el.offsetHeight < ButtonsMinHeight);
}

function isEditable(node) {
	var doc = node.ownerDocument;
	if (doc.designMode === "on" || node.isContentEditable)
		return true;
	if (["input", "textarea", "select", "object", "embed"].indexOf(node.localName) !== -1)
		return true;
	return false;
}

function iterateFrames(win, callback) {
	callback(win);
	if (win.frames && win.frames.length) {
		for (var i = 0; i < win.frames.length; ++i)
			iterateFrames(win.frames[i], callback);
	}
}

// === Logic ===

// ==== Click listeners ====

function onClick(event) {
	var win = event.target.ownerDocument.defaultView;
	if (CurrentHover)
		return;
	individuallyToggledImages.delete(win.document);
	setGifStateForWindow(win, false);
}

function updateClickListeners(forceRemove) {
	var shouldAdd = (Prefs.hoverPauseWhen === HoverPause.ClickOutside) && !forceRemove;
	if (shouldAdd)
		addEventListener("click", onClick);
	else
		removeEventListener("click", onClick);
}

// ==== Key listeners ====

function resetGifsInWindow(win) {
	// (Unfortunately this doesn't reach non-<img>s, but I don't see a way around that.
	// Well, no reasonable way at least. See the hack for tumblr below.)
	function resetList(els) {
		for (var i = 0, len = els.length; i < len; ++i) {
			try {
				resetImageAnimation(els[i]);
			} catch (ex) {} // not loaded
		}
	}
	resetList(win.document.getElementsByTagName("img"));
	resetList(win.document.getElementsByTagName("video"));
}

function toggleGifsInWindow(win) {
	try {
		var curState = getDwu(win).imageAnimationMode;

		// If we've toggled an individual image, and it's still in the viewport,
		// go by that instead of by the global animation mode.
		try {
			var el = individuallyToggledImages.get(win.document);
			if (el && inViewport(win, el)) {
				var ic = getIc(el);
				if (ic && ic.animated)
					curState = ic.animationMode;
			}
		} catch (ex) {
			// The image state has changed somehow. The default behavior will do.
		}

		setGifStateForWindow(win, curState === 1);
		if (CurrentHover)
			CurrentHover.refresh();
		forEachAnimationIndicator(win.document, showAnimationIndicator);
	} catch (ex) {
		// Some invisible iframes don't have presContexts, which breaks
		// the imageAnimationMode getter.
	}
}

function onKeydown(event) {
	if (event.defaultPrevented)
		return;
	var str = keyDownEventToString(event);
	if (!str || !(str === Prefs.shortcutToggle || str === Prefs.shortcutReset))
		return;

	var shouldCancel = true;
	if (!event.ctrlKey && !event.metaKey && !event.altKey) {
		// This is a bit precarious. We don't know whether the event will also be
		// consumed by the web page (either on keypress or on keydown without
		// calling preventDefault), and since the key binding doesn't include a
		// modifier key we also don't want to claim exclusive ownership of it.
		// First of all, if we are focusing an editable control, we should clearly
		// not handle the event:
		if (isEditable(event.originalTarget))
			return;

		// Otherwise, it seems pretty unlikely that the web page would care about
		// the event, but if it does, it's probably part of primary UI which is
		// important that it continues working. So we don't want to cancel the
		// event. Since toggling/resetting image animations is rather harmless
		// (and unnoticable unless there are GIFs visible), we can get around the
		// problem by consuming the event, but not calling preventDefault().
		// One exception to this: if find-as-you-type is enabled, we do cancel
		// events (and pray that there are no relevant keypress listeners).
		// It would be better to do all this on keypress, but then we race with FAYT. :(
		shouldCancel = prefService.getBoolPref("accessibility.typeaheadfind");
	}

	if (str === Prefs.shortcutToggle)
		iterateFrames(content, toggleGifsInWindow);

	if (str === Prefs.shortcutReset)
		iterateFrames(content, resetGifsInWindow);

	if (shouldCancel)
		cancelEvent(event);
}

function updateKeyListeners(forceRemove) {
	var shouldAdd = (Prefs.shortcutToggle || Prefs.shortcutReset) && !forceRemove;
	if (shouldAdd)
		addEventListener("keydown", onKeydown);
	else
		removeEventListener("keydown", onKeydown);
}

// ==== Load listeners ====

var exceptionList = [];
function locationOnExceptionList(loc) {
	var host = loc.host, list = exceptionList, i;
	if (host) {
		var suffixLoc = "." + host;
		for (i = 0; i < list.length; i++) {
			if (suffixLoc.endsWith(list[i]))
				return true;
		}
	}
	var prefixLoc = "." + loc.href + "/";
	for (i = 0; i < list.length; i++) {
		if (prefixLoc.startsWith(list[i]))
			return true;
	}
	return false;
}

function handleContentDocumentLoad(doc) {
	var win = doc && doc.defaultView, loc = doc && doc.location;

	if (loc && win && win.document === doc && loc.protocol !== "data:" &&
			locationOnExceptionList(loc)) {
		// This site is on the exception list. Play gifs iff the default is to pause them.
		var play = Prefs.defaultPaused;
		setGifStateForWindow(win, play);
	}
	if (Prefs.indicatorStyle > 0)
		showIndicatorsForDocument(doc, true);
}

function onDOMWindowCreated(ev) {
	handleContentDocumentLoad(ev.target);
}

var shownIndicator = false;
function maybeHookContentWindows(forceUnhook, initial) {
	function id(x) { return x; }
	function addDot(x) { return "." + x; }
	exceptionList = Prefs.pauseExceptions.split(/[ ,]+/).filter(id).map(addDot);
	var shouldShowIndicator = Prefs.indicatorStyle > 0 && !forceUnhook;
	var shouldHook = (Prefs.indicatorStyle > 0 || exceptionList.length > 0) && !forceUnhook;
	if (shouldHook)
		addEventListener("DOMWindowCreated", onDOMWindowCreated);
	else
		removeEventListener("DOMWindowCreated", onDOMWindowCreated);

	if (shouldHook && initial && content) {
		// Iterate over the ones we missed initially.
		iterateFrames(content, function(w) {
			handleContentDocumentLoad(w.document);
		});
	}

	if (shownIndicator && !shouldShowIndicator) {
		iterateFrames(content, function(w) {
			showIndicatorsForDocument(w.document, false);
		});
	}
	shownIndicator = shouldShowIndicator;
}

function showIndicatorsForDocument(doc, show) {
	if (show) {
		doc.addEventListener("load", onLoad, true);
	}
	else {
		doc.removeEventListener("load", onLoad, true);
		forEachAnimationIndicator(doc, function(el) {
			// (Prefs.indicatorStyle may have changed, so we cannot use removeIndicator here.)
			el.style.filter = el.opacity = "";
		});
		animationIndicators.delete(doc);
		doc[eNoMoreGifIndicators] = true;
	}
}

function initGifState(el, noIndicator) {
	var doc = el.ownerDocument;
	if (el[eInitedGif])
		return;
	el[eInitedGif] = true;
	if (isGifv(el)) {
		if (Prefs.defaultPaused)
			getIc(el).animationMode = 1;
	}
	if (Prefs.indicatorStyle > 0 && !noIndicator && !imageTooSmall(el)) {
		var ic = getIc(el), shouldShow = false;
		try {
			shouldShow = (ic && ic.animated);
		}
		catch (ex) {
			// Image not yet decoded, so we don't know the animation state.
			// Set up an observer and wait for a decode signal.
			// Removing the observers is somewhat annoying, so we don't.
			var ilc = el.QueryInterface(Ci.nsIImageLoadingContent);
			if (!ilc)
				return;
			var observer = null;
			var jsObserver = {
				sizeAvailable: function() {},
				frameComplete: function() {},
				decodeComplete: function() {},
				loadComplete: function() {},
				frameUpdate: function() {},
				discard: function() {},
				isAnimated: function() {},
			};
			jsObserver.decodeComplete = function() {
				ilc.removeObserver(observer);
				// Set a zero-length timeout, because I'm not certain that it's
				// safe to run arbitrary scripts off observer notifications.
				doc.defaultView.setTimeout(function() {
					if (!AddonIsEnabled || Prefs.indicatorStyle === 0 || doc[eNoMoreGifIndicators])
						return;
					var ic = getIc(el);
					if (ic && ic.animated && !el[eHasHovered])
						showAnimationIndicator(el);
				});
			};
			observer = Cc["@mozilla.org/image/tools;1"]
				.getService(Ci.imgITools).createScriptedObserver(jsObserver);
			ilc.addObserver(observer);
		}
		if (shouldShow)
			showAnimationIndicator(el);
	}
}

function onLoadedMetadata(event) {
	if (isGifv(event.target))
		initGifState(event.target);
}

function onLoad(event) {
	if (!AddonIsEnabled)
		return;
	var el = event.target;
	if (el.localName === "img")
		initGifState(el);
}

function updateLoadListeners(forceRemove) {
	if (!forceRemove)
		addEventListener("loadedmetadata", onLoadedMetadata, true);
	else
		removeEventListener("loadedmetadata", onLoadedMetadata, true);
}

// ==== Hovering ====

function onImageMouseDown(event) {
	if (!isLeftClick(event) || event.defaultPrevented || !CurrentHover)
		return;

	// Check whether this event looks safe to handle by ourselves. (This is pretty awful, yes.)
	var el = event.target, doc = el.ownerDocument, win = doc.defaultView;
	var allowedCursors = ["", "default", "auto", "none", "not-allowed", "progress", "wait"];
	if (allowedCursors.indexOf(win.getComputedStyle(el).cursor) === -1)
		return;
	if (hasEventListenerOfType(el, "click"))
		return;

	CurrentHover.toggleImageAnimation();
}

function showAnimationIndicator(el) {
	var doc = el.ownerDocument;
	var indicators = animationIndicators.get(doc);
	if (!indicators) {
		indicators = new Set();
		animationIndicators.set(doc, indicators);

		var cr = function(name, attrs) {
			var ret = doc.createElementNS("http://www.w3.org/2000/svg", name);
			for (var a in attrs)
				ret.setAttribute(a, attrs[a]);
			return ret;
		};
		var svg = cr("svg", {width: "0", height: "0"});
		svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
		svg.style.position = "absolute";
		var defs = cr("defs", {});
		var filter = cr("filter", {id: "toggleGifsIndicatorFilter",
			x: "0", y: "0", width: "100%", height: "100%"});
		var feImage = cr("feImage", {preserveAspectRatio: "xMaxYMin meet",
			width: "100%", height: "19", y: "3", result: "img"});
		feImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", PlayIcon);
		var feColorMat = cr("feColorMatrix", {in: "img", result: "img2",
			type: "matrix", values: "2 2 2 0 0 0 0.5 0 0 0 0 0 0.5 0 0 0 0 0 1 0"});
		var feComposite = cr("feComposite", {operator: "over", in: "img2", in2: "SourceGraphic"});
		filter.appendChild(feImage);
		filter.appendChild(feColorMat);
		filter.appendChild(feComposite);
		defs.appendChild(filter);
		svg.appendChild(defs);
		doc.documentElement.appendChild(svg);
	}

	try {
		var playing = (getIc(el).animationMode === 0);
		if (playing && getDwu(doc.defaultView).imageAnimationMode === 1 && !el.getClientRects()[0]) {
			// This can happen if we got a decode signal from e.g. a cached image, but
			// the animation state isn't set yet because the image element is display: none.
			playing = false;
		}

		if (playing) {
			removeIndicator(el);
		}
		else {
			if (Prefs.indicatorStyle === 1) {
				el.style.filter = "url(#toggleGifsIndicatorFilter)";
			}
			else if (Prefs.indicatorStyle === 2) {
				el.style.transition = "opacity 0.4s";
				el.style.opacity = "0.2";
			}
			indicators.add(el);

			if (isGifv(el)) {
				// A playing video with an SVG filter kills performance, so as a safety measure,
				// remove the indicator again if the video is played by script.
				el.addEventListener("play", function() {
					removeIndicator(this);
				});
			}
		}
	} catch (ex) {} // no longer visible, or so
}

function removeIndicator(el) {
	var indicators = animationIndicators.get(el.ownerDocument);
	if (!indicators || !indicators.has(el))
		return;
	if (Prefs.indicatorStyle === 1)
		el.style.filter = "none";
	else if (Prefs.indicatorStyle === 2)
		el.style.opacity = "1";
	indicators.delete(el);
}

function clearHoverEffect() {
	if (!CurrentHover)
		return;
	try {
		CurrentHover.clearTimeouts();
		if (CurrentHover.overlay && CurrentHover.overlay.parentNode)
			CurrentHover.overlay.parentNode.removeChild(CurrentHover.overlay);
		if (CurrentHover.mo)
			CurrentHover.mo.disconnect();
		var el = CurrentHover.element;
		el.removeEventListener("mousedown", onImageMouseDown);
		if (Prefs.hoverPauseWhen === HoverPause.Unhover && CurrentHover.playing &&
				individuallyToggledImages.get(el.ownerDocument) === el) {
			individuallyToggledImages.delete(el.ownerDocument);
			getIc(el).animationMode = 1;
		}
	} catch (ex) {} // dead wrapper exceptions
	CurrentHover = null;
}

function applyHoverEffect(el) {
	var doc = el.ownerDocument, win = doc.defaultView;
	var ic = getIc(el);
	initGifState(el, true);
	el[eHasHovered] = true;

	CurrentHover = {
		element: el,
		playing: null,
		overlay: null,
		timeoutClearer: null,
		clearTimeouts: function() {
			if (this.timeoutClearer)
				this.timeoutClearer();
		},
		toggleImageAnimation: function() {
			individuallyToggledImages.set(el.ownerDocument, el);
			this.playing = !this.playing;
			ic.animationMode = this.playing ? 0 : 1;
			this.setPauseButtonAppearance();
		},
		refresh: function() {
			this.playing = (ic.animationMode === 0);
			this.setPauseButtonAppearance();
		},
		setPauseButtonAppearance: function() {}
	};
	CurrentHover.refresh();

	if (Prefs.toggleOnClick)
		el.addEventListener("mousedown", onImageMouseDown);

	if (Prefs.playOnHover && !CurrentHover.playing) {
		var previous = individuallyToggledImages.get(el.ownerDocument);
		if (previous !== el) {
			if (Prefs.hoverPauseWhen === HoverPause.Next) {
				try {
					getIc(previous).animationMode = 1;
				} catch(e) {} // dead image
			}

			if (Prefs.hoverPlayOnLoad && !hasLoaded(el)) {
				individuallyToggledImages.set(el.ownerDocument, el);
				if (!el[eAttachedLoadWaiter]) {
					// Removing this listener on unhover or pref change is too much work. Just
					// recheck that everything of relevance still holds true when it fires, instead.
					el[eAttachedLoadWaiter] = true;
					el.addEventListener("load", function() {
						var ic = getIc(el);
						var prev = individuallyToggledImages.get(el.ownerDocument);
						if (AddonIsEnabled && Prefs.playOnHover && Prefs.hoverPlayOnLoad &&
							ic.animationMode === 1 &&
							(Prefs.hoverPauseWhen === HoverPause.Never || prev === el))
						{
							ic.animationMode = 0;
							if (CurrentHover)
								CurrentHover.refresh();
						}
					}, true);
				}
			}
			else {
				CurrentHover.toggleImageAnimation();
			}
		}
	}

	removeIndicator(el);

	if (!Prefs.showOverlays)
		return;

	if (imageTooSmall(el))
		return;

	var overlay = doc.createElement("div");
	overlay.id = "toggleGifsOverlay";

	var css = doc.createElement("style");
	css.textContent = OverlayCss;
	overlay.appendChild(css);

	// TODO: All these listeners should be capturing and registered on the document.
	var resetButton = doc.createElement("span");
	resetButton.id = "toggleGifsResetButton";
	resetButton.style.backgroundImage = "url(" + ResetIcon + ")";
	resetButton.onmousedown = function(event) {
		if (!isLeftClick(event))
			return;
		resetImageAnimation(el);
		cancelEvent(event);
	};
	resetButton.onclick = resetButton.onmouseup = cancelEvent;
	var pauseButton = doc.createElement("span");
	pauseButton.id = "toggleGifsPauseButton";
	CurrentHover.setPauseButtonAppearance = function() {
		pauseButton.style.backgroundImage =
			"url(" + (this.playing ? PauseIcon : PlayIcon) + ")";
	};
	CurrentHover.setPauseButtonAppearance();
	pauseButton.onmousedown = function(event) {
		if (!isLeftClick(event))
			return;
		CurrentHover.toggleImageAnimation();
		cancelEvent(event);
	};
	pauseButton.onclick = pauseButton.onmouseup = cancelEvent;

	var content = doc.createElement("span");
	content.id = "toggleGifsContent";
	content.appendChild(resetButton);
	content.appendChild(pauseButton);
	overlay.appendChild(content);

	var offsetBase = el[ePositionAsIf] || el;
	var reposition = function() {
		var par = offsetBase.offsetParent;
		var x = offsetBase.offsetLeft, y = offsetBase.offsetTop;

		// Skip past <td>s and <table>s, which appear in the offsetParent tree
		// despite not being positioned.
		while (par && par.localName !== "body" && win.getComputedStyle(par).position === "static") {
			x += par.offsetLeft;
			y += par.offsetTop;
			par = par.offsetParent;
		}

		par = par || doc.body;
		var style = win.getComputedStyle(offsetBase);
		y += parseFloat(style.borderTopWidth);
		x += offsetBase.offsetWidth - parseFloat(style.borderLeftWidth);
		overlay.style.top = y + "px";
		overlay.style.left = x + "px";
		par.appendChild(overlay);
	};
	reposition();

	CurrentHover.overlay = overlay;

	var mo = new win.MutationObserver(reposition);
	mo.observe(el, {attributes: true});
	CurrentHover.mo = mo;
}

function setTumblrRelatedImage(el) {
	if (el[eRelatedTo])
		return true;
	var doc = el.ownerDocument, par = el;
	while (par && !(par.classList && par.classList.contains("post")))
		par = par.parentNode;
	par = par && par.getElementsByClassName("post_content")[0];
	var imDiv = par && (par.querySelector("div.photo_stage_img") || par.querySelector("div.post_thumbnail_container"));
	if (imDiv) {
		if (!imDiv[eFakeImage]) {
			var cs = doc.defaultView.getComputedStyle(imDiv);
			var bg = cs && cs.backgroundImage;
			if (!bg) return false;
			var r = /^url\("(.*)"\)$/.exec(bg);
			var src = r && r[1];
			if (!src) return false;

			// Now ideally we would replace tumblr's background-image-based thingy with
			// a real img tag. However, mimicking the exact positioning and clipping of the
			// image is difficult and fragile, so we abuse bug 332973 instead.
			var dummyImg = doc.createElement("img");
			dummyImg.src = src;
			// imDiv.parentNode.replaceChild(dummyImg, imDiv);
			dummyImg.style.display = "none";
			dummyImg[ePositionAsIf] = imDiv;
			imDiv.appendChild(dummyImg);
			imDiv[eFakeImage] = dummyImg;
		}

		el[eRelatedTo] = imDiv[eFakeImage];
		return true;
	}
	var img = par && par.getElementsByTagName("img")[0];
	if (img) {
		el[eRelatedTo] = img;
		return true;
	}
	return false;
}

function handlePinterestHover(el) {
	// Pinterest has their own GIF play buttons. Let them do their thing, and
	// auto-animate the image that appears after clicking "play".
	if (el[eHandledPinterest] || !el.parentNode.querySelector(".playIndicatorPill.gifType"))
		return;
	el[eHandledPinterest] = true;
	var img = el.parentNode.getElementsByTagName("img")[0];
	img.addEventListener("load", function() {
		var ic = getIc(img);
		if (ic && ic.animated)
			ic.animationMode = 0;
	});
}

function partOfHoverTarget(el) {
	return CurrentHover && (el === CurrentHover.element ||
		el[eRelatedTo] === CurrentHover.element ||
		(el.id && el.id.startsWith("toggleGifs")));
}

var CurrentHoverCancelLoadWaiters = function() {};
function onMouseOver(event) {
	var el = event.target, win = el.ownerDocument.defaultView;
	var host = win.location.host, cl = el.className;

	var hasRelatedImage = false;
	if (host.indexOf("tumblr") !== -1 && ["post_controls_top", "post_tags_inner", "click_glass",
			"hover", "hover_inner", "post_date", "post_notes"].indexOf(cl) !== -1) {
		hasRelatedImage = setTumblrRelatedImage(el);
	}

	if (host.indexOf("pinterest") !== -1 && (cl === "hoverMask" || cl === "playIndicatorPill"))
		return handlePinterestHover(el);

	CurrentHoverCancelLoadWaiters();
	if (CurrentHover) {
		if (partOfHoverTarget(el)) {
			CurrentHover.clearTimeouts();
			return;
		}
		clearHoverEffect();
	}

	if (hasRelatedImage)
		handleImgHover(el[eRelatedTo]);
	else if ((el.localName === "img" || isGifv(el)) && el instanceof win.HTMLElement)
		handleImgHover(el);
}

function handleImgHover(el) {
	var win = el.ownerDocument.defaultView;

	try {
		var ic = getIc(el);
		if (!ic || !ic.animated)
			return;
	} catch (ex) {
		// Image not loaded. Try again after a while, until mouseout or another
		// mouseover happens and we clear the timer.
		var to = win.setTimeout(function() {
			CurrentHoverCancelLoadWaiters = function() {};
			handleImgHover(el);
		}, 30);
		CurrentHoverCancelLoadWaiters = function() {
			CurrentHoverCancelLoadWaiters = function() {};
			try {
				win.clearTimeout(to);
			} catch (ex) {} // dead wrappers
		};
		return;
	}

	applyHoverEffect(el);
}

function onMouseOut() {
	CurrentHoverCancelLoadWaiters();
	if (!CurrentHover || CurrentHover.timeoutClearer)
		return;
	try {
		var win = CurrentHover.element.ownerDocument.defaultView;
		var timeout = win.setTimeout(function() {
			CurrentHover.timeoutClearer = null;
			clearHoverEffect();
		}, 50);
		CurrentHover.timeoutClearer = function() {
			CurrentHover.timeoutClearer = null;
			win.clearTimeout(timeout);
		};
	} catch (ex) {
		clearHoverEffect();
	}
}

function updateHoverListeners(forceRemove) {
	clearHoverEffect();
	var shouldAdd = !forceRemove;
	if (shouldAdd) {
		addEventListener("mouseover", onMouseOver);
		addEventListener("mouseout", onMouseOut);
	}
	else {
		removeEventListener("mouseover", onMouseOver);
		removeEventListener("mouseout", onMouseOut);
	}
}

// === Signals ===

var MMPrefix = Components.stack.filename + ":";
var signals = [];
function addSignal(signal, callback) {
	addMessageListener(MMPrefix + signal, callback);
	signals.push({signal: signal, callback: callback});
}

addSignal("set-gif-state", function(msg) {
	setGifStateForWindow(content, msg.data.playing);
});

addSignal("update-pref", function(msg) {
	var key = msg.data.key, value = msg.data.value;
	Prefs[key] = value;
	if (key === "showOverlays" || key === "toggleOnClick")
		updateHoverListeners();
	else if (key === "hoverPauseWhen")
		updateClickListeners();
	else if (key === "pauseExceptions" || key === "indicatorStyle")
		maybeHookContentWindows();
});

addSignal("destroy", function() {
	AddonIsEnabled = false;
	for (var sig of signals)
		removeMessageListener(MMPrefix + sig.signal, sig.callback);
	updateKeyListeners(true);
	updateClickListeners(true);
	updateHoverListeners(true);
	updateLoadListeners(true);
	maybeHookContentWindows(true);
});

function init() {
	var ret = sendSyncMessage(MMPrefix + "browser-init")[0];
	if (!ret) {
		// Sometimes we get disconnected from the parent. Just abort in this case.
		// (This sometimes also happens silently; we simply stop getting signals.
		// But it should be fine in our case, hopefully...)
		return;
	}
	Prefs = ret.prefs;
	updateKeyListeners();
	updateClickListeners();
	updateHoverListeners();
	updateLoadListeners();
	maybeHookContentWindows(false, true);
}
init();

})();
