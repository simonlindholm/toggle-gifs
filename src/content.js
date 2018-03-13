import defaultPrefs from "./defaultPrefs";

// ==== Constants ====

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

const HoverPause = { Never: 0, Next: 1, Unhover: 2, ClickOutside: 3 };

const ButtonsMinWidth = 60;
const ButtonsMinHeight = 40;

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
let AnimationBehavior = null;

const IsTumblr = document.location.host.indexOf("tumblr") !== -1;
const IsPinterest = document.location.host.indexOf("pinterest") !== -1;

// ==== Global state ====

let WantedAnimationBehavior = null;
let CurrentHover = null;
let LastToggledImage = null;
let HoveredNonanimatedImage = null;
let NonDefaultFrame = null;
let NonDefaultFramePromise = null;
let AnimationIndicators = new Set();
let HasInjectedCss = false;
let HasInjectedSvg = false;
let SeenAnyAnimated = false;
let Prefs = null;

// 1 = yes, 2 = waiting.
// No signal for "no", because some requests might never hit the network,
// and some may have done, but have since been evicted from the parent cache.
// A timer could work, I guess, but for now let's try to do without it.
// For simplicity we let this leak without bounds, because it will vanish
// when the tab closes. (An LRU cache would also be an option, but then
// resetImagesInWindow would have to change.)
const AnimatedMap = new Map();

// ==== Expando symbols ====

const eAwaitingPlay = "toggleGifs-awaitingPlay";
const eAnimationState = "toggleGifs-animationState";
const eCheckedAnimation = "toggleGifs-checkedAnimation";
const eHasHovered = "toggleGifs-hasHovered";
const eTooSmall = "toggleGifs-tooSmall";
const eOnLoad = "toggleGifs-onLoad";
const eShownIndicator = "toggleGifs-shownIndicator";
const eInitedGifv = "toggleGifs-initedGifv";
const eRelatedTo = "toggleGifs-relatedTo";
const eFakeImage = "toggleGifs-fakeImage";
const eHandledPinterest = "toggleGifs-handledPinterest";
const ePositionAsIf = "toggleGifs-positionAsIf";
const eImageClone = "toggleGifs-imageClone";

// ==== Helpers ====

// Keep in sync with settings.js!
function keyDownEventToString(event) {
  function keyToString(ev) {
    const { which, key } = ev;
    if (which === 27) return "Esc";
    if (which === 32) return "Space";
    if (which === 13) return "Enter";
    if (which < 32) return null;
    return key.length === 1 ? key.toUpperCase() : key;
  }
  function accelToString(ev) {
    let accel = "";
    if (ev.ctrlKey) accel += "Ctrl+";
    if (ev.metaKey) accel += "Meta+";
    if (ev.shiftKey) accel += "Shift+";
    if (ev.altKey) accel += "Alt+";
    return accel;
  }
  const key = keyToString(event);
  const accel = accelToString(event);
  return key ? accel + key : "";
}

function delay(ms) {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });
}

// Needed due to https://bugzilla.mozilla.org/show_bug.cgi?id=1369841.
function sendMessageWithRetry(msg) {
  function rec(attempt, dur) {
    return browser.runtime.sendMessage(msg).catch(e => {
      if (dur >= 5000)
        throw new Error(
          `Failed to talk to background script even after retries: ${String(e)}`
        );
      if (attempt === 0)
        console.warn(
          "Unable to talk to background script; bug 1369841? Retrying."
        );
      return delay(dur).then(() => rec(attempt + 1, dur * 2));
    });
  }
  return rec(0, 20);
}

function hash(url) {
  // Poor man's hash function. Probably good enough for uniqueness purposes,
  // but suboptimally long.
  if (url.length <= 250) return url;
  return url.substr(0, 240) + url.substr(-10) + url.length;
}

function cancelEvent(event) {
  event.stopImmediatePropagation();
  event.preventDefault();
}

function noop() {
  // Do nothing.
}

function forEachAnimationIndicator(func) {
  AnimationIndicators.forEach(el => {
    try {
      func(el);
    } catch (ex) {
      // Let's be defensive.
      AnimationIndicators.delete(el);
      console.error(ex);
    }
  });
}

function inViewport(element) {
  const el = element[ePositionAsIf] || element;
  if (el.ownerDocument !== document || !document.contains(el)) return false;
  if (window.getComputedStyle(el).display === "none") return false;
  const re = el.getClientRects()[0];
  return re && re.bottom > 0 && re.top < window.innerHeight;
}

function semiHide(el) {
  // Hide an element from the eye and prevent it from affecting layout, but
  // keep it visible for Firefox's GIF-rendering code.
  // TODO
  console.info("semiHide", el);
}

function waitForPaint(callback, num = 1) {
  window.requestAnimationFrame(() => {
    if (num === 1) callback();
    else waitForPaint(callback, num - 1);
  });
}

function isLeftClick(event) {
  return event.isTrusted && event.which === 1;
}

function isGifv(el) {
  // As of June 2015. Should probably be re-checked...
  if (el.localName !== "video" || !Prefs.supportGifv) return false;
  if (
    el.hasAttribute("muted") &&
    el.hasAttribute("autoplay") &&
    (el.getAttribute("poster") || "").indexOf("i.imgur") !== -1
  ) {
    // Imgur. imgur.com has its own play indicator on mobile, respect that.
    return el.ownerDocument.location.host !== "m.imgur.com";
  }
  if (el.hasAttribute("controls")) return false;
  if (el.id === "mainVid0" || el.classList.contains("gfyVid"))
    // gfycat
    return true;
  return (
    el.hasAttribute("muted") &&
    el.hasAttribute("loop") &&
    el.hasAttribute("autoplay")
  );
}

function hasLoaded(el) {
  return isGifv(el) || el.complete;
}

function imageTooSmall(el) {
  let ret = el[eTooSmall];
  if (ret !== undefined) return ret;
  if (el.width && el.height)
    ret = el.width < ButtonsMinWidth || el.height < ButtonsMinHeight;
  else
    ret =
      el.offsetWidth < ButtonsMinWidth || el.offsetHeight < ButtonsMinHeight;
  el.setAttribut(eTooSmall, ret);
  return ret;
}

function withImageClone(el, callback) {
  let cl = el[eImageClone];
  if (cl) {
    if (cl.src !== el.src) {
      cl.remove();
    } else {
      callback(cl);
      return;
    }
  }
  if (el.hasAttribute("srcset")) {
    // It is impossible to clone images with srcset and have them share
    // animation mode... So let's convert the image to not use srcset, so
    // we get slightly more control over it. Occurs on wikipedia, mainly.
    const src = el.currentSrc;
    el.removeAttribute("srcset");
    el.removeAttribute("sizes");
    el.setAttribut(eOnLoad, () => {
      // For reasons I don't fully understand, we sometimes need to
      // wait a bit after load for pausing to work.
      waitForPaint(() => {
        withImageClone(el, callback);
      });
    });
    if (src) el.setAttribute("src", src);
    return;
  }

  cl = el.cloneNode(false);
  cl.getAttributeNames().forEach(attr => {
    if (attr !== "src") cl.removeAttribute(attr);
  });
  semiHide(cl);
  el.setAttribute(eImageClone, cl);
  callback(cl);
}

function withNonDefaultFrame(callback) {
  if (NonDefaultFrame) {
    if (document.contains(NonDefaultFrame)) {
      callback(NonDefaultFrame.contentWindow);
      return;
    }
    NonDefaultFrame = null;
    NonDefaultFramePromise = null;
  }
  if (!NonDefaultFramePromise) {
    NonDefaultFramePromise = new Promise((resolve, fail) => {
      const key = `${Date.now()}.${Math.random()}`;
      browser.runtime
        .sendMessage({
          type: "temporary-behavior",
          value: AnimationBehavior === "none" ? "normal" : "none",
          key
        })
        .then(() => {
          const ifr = document.createElement("iframe");
          ifr.setAttribute("toggle-gifs-frame", "");
          ifr.srcdoc = "<!DOCTYPE html><body></body>";
          ifr.addEventListener(
            "load",
            event => {
              if (!event.isTrusted) return;
              NonDefaultFrame = ifr;
              resolve(ifr.contentWindow);
              browser.runtime.sendMessage({
                type: "done-temporary-behavior",
                key
              });
              event.stopImmediatePropagation();
            },
            true
          );
          ifr.addEventListener(
            "error",
            event => {
              if (!event.isTrusted) return;
              browser.runtime.sendMessage({
                type: "done-temporary-behavior",
                key
              });
              fail(new Error("failed to load frame"));
              event.stopImmediatePropagation();
            },
            true
          );
          semiHide(ifr);
          document.body.appendChild(ifr);
        })
        .catch(fail);
    }).catch(err => {
      console.error(err);
      throw err;
    });
  }
  NonDefaultFramePromise.then(callback);
}

function setAnimationState(el, state) {
  if (el.tagName === "VIDEO") {
    if (state === "normal") el.play();
    else el.pause();
  } else {
    const currentState = el[eAnimationState] || AnimationBehavior;
    if (currentState === state) return;
    el.setAttribute(eAnimationState, state);
    if (state === AnimationBehavior) {
      withImageClone(el, cl => {
        document.body.appendChild(cl);
      });
    } else {
      withNonDefaultFrame(fr => {
        withImageClone(el, cl => {
          fr.document.body.appendChild(cl);
        });
      });
    }
  }
}

function getAnimationState(el) {
  if (el.tagName === "VIDEO") {
    return el.paused ? "none" : "normal";
  }
  return el[eAnimationState] || AnimationBehavior;
}

function resetImageAnimation(img) {
  if (img.tagName === "VIDEO") {
    img.setAttribute("currentTime", 0);
  } else if (getAnimationState(img) === "normal") {
    // The basic idea here is to do "img.src = img.src", which works
    // without side effects because of:
    // https://html.spec.whatwg.org/multipage/images.html#reacting-to-dom-mutations
    // However, things get more complex in weird states.
    new window.Image().src = img.src;
  } else if (
    AnimationBehavior === "none" &&
    (img[eAnimationState] && NonDefaultFrame)
  ) {
    // We cannot reset paused images if we are ourselves paused.
    setAnimationState(img, "normal");
    // XXX then async?
    img.setAttribute("src", img.src);
  } else {
    // The first "img.src = img.src" will cause the image to start
    // playing, the second to reset. Then we stop it again.
    img.setAttribute("src", img.src);
    img.setAttribute("src", img.src);
    img.setAttribute(eAnimationState, "normal");
    setAnimationState(img, "none");
  }
}

function isAnimatedImage(el) {
  if (el.tagName === "VIDEO") {
    return isGifv(el);
  }
  return el.tagName === "IMG" && AnimatedMap.get(hash(el.src)) === 1;
}

// ==== Application logic ====

function injectIndicatorSvg() {
  if (HasInjectedSvg) return;
  HasInjectedSvg = true;

  function cr(name, attrs) {
    const ret = document.createElementNS("http://www.w3.org/2000/svg", name);
    attrs.forEach(a => ret.setAttribute(a, attrs[a]));
    return ret;
  }

  const svg = cr("svg", { width: "0", height: "0" });
  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink"
  );
  svg.style.position = "absolute";
  const defs = cr("defs", {});
  const filter = cr("filter", {
    id: "toggleGifsIndicatorFilter",
    x: "0",
    y: "0",
    width: "100%",
    height: "100%"
  });
  const feImage = cr("feImage", {
    preserveAspectRatio: "xMaxYMin meet",
    width: "100%",
    height: "19",
    y: "3",
    result: "img"
  });
  feImage.setAttributeNS(
    "http://www.w3.org/1999/xlink",
    "xlink:href",
    PlayIcon
  );
  const feComposite = cr("feComposite", {
    operator: "over",
    in: "img",
    in2: "SourceGraphic"
  });
  filter.appendChild(feImage);
  filter.appendChild(feComposite);
  defs.appendChild(filter);
  svg.appendChild(defs);
  document.documentElement.appendChild(svg);
}

function updateIndicator(element) {
  const el = element;
  if (Prefs.indicatorStyle === 0 || imageTooSmall(el)) return;

  let shouldShow = getAnimationState(el) !== "normal";
  if (Prefs.showOverlays && CurrentHover && CurrentHover.element === el) {
    shouldShow = false;
  }

  if (shouldShow) {
    if (Prefs.indicatorStyle === 1) {
      injectIndicatorSvg();
      el.style.filter = "url(#toggleGifsIndicatorFilter)";
    } else if (Prefs.indicatorStyle === 2) {
      // We don't want to do this twice, since it looks weird.
      if (!el[eShownIndicator]) {
        el.style.transition = "opacity 0.4s";
        el.style.opacity = "0.2";
      }
      el.setAttribute(eShownIndicator, true);
    }
  } else if (Prefs.indicatorStyle === 1) el.style.filter = "none";
  else if (Prefs.indicatorStyle === 2) el.style.opacity = "1";

  if (el.tagName === "VIDEO" && !AnimationIndicators.has(el)) {
    // A playing video with an SVG filter kills performance, so as a safety measure,
    // remove the indicator again if the video is played by script.
    el.addEventListener(
      "play",
      event => event.isTrusted && updateIndicator(event.target)
    );
  }
  AnimationIndicators.add(el);
}

// ==== Click listeners ====

function onClick(event) {
  if (!isLeftClick(event) || CurrentHover) return;
  if (LastToggledImage) {
    setAnimationState(LastToggledImage, "none");
  }
  LastToggledImage = null;
  forEachAnimationIndicator(updateIndicator);
}

function updateClickListeners() {
  const shouldAdd = Prefs.hoverPauseWhen === HoverPause.ClickOutside;
  if (shouldAdd) window.addEventListener("click", onClick);
  else window.removeEventListener("click", onClick);
}

// ==== Key listeners ====

function resetImagesInWindow() {
  // (Unfortunately this doesn't reach CSS background images. We could fix
  // that by calling getComputedStyle on *everything*, or by sending URLs of
  // non-<img>s down from the parent, and then doing 'new Image().src = url'.
  // But it's a bit complex.)
  let any = false;
  ["video", "img"].forEach(tagName => {
    document.getElementsByTagName(tagName).forEach(el => {
      if (isAnimatedImage(el)) {
        resetImageAnimation(el);
        any = true;
      }
    });
  });
  return any;
}

function toggleImagesInWindow() {
  let curState = WantedAnimationBehavior;

  // If we've toggled an individual image, and it's still in the viewport,
  // go by that instead of by the global animation mode.
  if (
    LastToggledImage &&
    inViewport(LastToggledImage) &&
    isAnimatedImage(LastToggledImage)
  ) {
    curState = getAnimationState(LastToggledImage);
  }

  WantedAnimationBehavior = curState === "none" ? "normal" : "none";

  let any = false;
  ["video", "img"].forEach(tagName => {
    document.getElementsByTagName(tagName).forEach(el => {
      if (isAnimatedImage(el)) {
        setAnimationState(el, WantedAnimationBehavior);
        any = true;
      }
    });
  });

  if (CurrentHover) CurrentHover.refresh();
  forEachAnimationIndicator(updateIndicator);

  return any || SeenAnyAnimated;
}

function onKeydown(event) {
  if (!event.isTrusted || event.defaultPrevented) return;
  const str = keyDownEventToString(event);
  if (!str || !(str === Prefs.shortcutToggle || str === Prefs.shortcutReset))
    return;

  // In case of modifier-less binding, we want to be a bit careful and
  // only cancel the event in case the shortcut actually had an effect.
  let shouldCancel = event.ctrlKey || event.metaKey || event.altKey;

  if (str === Prefs.shortcutToggle)
    shouldCancel = toggleImagesInWindow() || shouldCancel;

  if (str === Prefs.shortcutReset)
    shouldCancel = resetImagesInWindow() || shouldCancel;

  if (shouldCancel) cancelEvent(event);
}

function updateKeyListeners() {
  const shouldAdd = Prefs.shortcutToggle || Prefs.shortcutReset;
  if (shouldAdd) window.addEventListener("keydown", onKeydown);
  else window.removeEventListener("keydown", onKeydown);
}

// ==== Overlay ====

function injectOverlayCss() {
  if (HasInjectedCss) return;
  HasInjectedCss = true;
  const css = document.createElement("style");
  css.textContent = OverlayCss;
  css.style.display = "none";
  document.documentElement.appendChild(css);
}

function updateAllIndicators(prev, cur) {
  if (prev > 0 && cur === 0) {
    forEachAnimationIndicator(element => {
      const el = element;
      if (prev === 1) el.style.filter = "";
      else el.style.opacity = "";
    });
    AnimationIndicators = new Set();
  } else if (prev === 0 && cur > 0) {
    ["video", "img"].forEach(tagName => {
      document.getElementsByTagName(tagName).forEach(element => {
        const el = element;
        if (isAnimatedImage(el)) {
          updateIndicator(el);
        }
      });
    });
  }
}

function applyHoverEffect(el) {
  CurrentHover = {
    element: el,
    playing: null,
    overlay: null,
    mouseoutTimeout: null,
    clearTimeouts() {
      if (this.mouseoutTimeout) {
        window.clearTimeout(this.mouseoutTimeout);
        this.mouseoutTimeout = null;
      }
    },
    toggleImageAnimation() {
      LastToggledImage = el;
      this.playing = !this.playing;
      setAnimationState(el, this.playing ? "normal" : "none");
      this.setPauseButtonAppearance();
    },
    refresh() {
      this.playing = getAnimationState(el) === "normal";
      this.setPauseButtonAppearance();
    },
    setPauseButtonAppearance: noop
  };

  CurrentHover.refresh();

  if (Prefs.playOnHover && !CurrentHover.playing) {
    if (LastToggledImage !== el) {
      if (LastToggledImage && Prefs.hoverPauseWhen === HoverPause.Next) {
        setAnimationState(LastToggledImage, "none");
        updateIndicator(LastToggledImage);
      }

      if (Prefs.hoverPlayOnLoad && !hasLoaded(el)) {
        LastToggledImage = el;
        el.setAttribute(eHasHovered, true);
      } else {
        CurrentHover.toggleImageAnimation();
        updateIndicator(el);
      }
    }
  }

  if (!Prefs.showOverlays || imageTooSmall(el)) return;

  updateIndicator(el);

  injectOverlayCss();

  const overlay = document.createElement("div");
  overlay.id = "toggleGifsOverlay";

  // (For defense against page listeners, all of these listeners should
  // really be registered on the document.)
  const resetButton = document.createElement("span");
  resetButton.id = "toggleGifsResetButton";
  resetButton.style.backgroundImage = `url(${ResetIcon})`;
  resetButton.addEventListener(
    "mousedown",
    event => {
      if (!isLeftClick(event)) return;
      resetImageAnimation(el);
      cancelEvent(event);
    },
    true
  );
  resetButton.addEventListener("click", cancelEvent, true);
  resetButton.addEventListener("mouseup", cancelEvent, true);

  const pauseButton = document.createElement("span");
  pauseButton.id = "toggleGifsPauseButton";
  CurrentHover.setPauseButtonAppearance = () => {
    pauseButton.style.backgroundImage = `url(${
      CurrentHover.playing ? PauseIcon : PlayIcon
    })`;
  };
  CurrentHover.setPauseButtonAppearance();
  pauseButton.addEventListener(
    "mousedown",
    event => {
      if (!isLeftClick(event)) return;
      CurrentHover.toggleImageAnimation();
      cancelEvent(event);
    },
    true
  );
  pauseButton.addEventListener("click", cancelEvent, true);
  pauseButton.addEventListener("mouseup", cancelEvent, true);

  const content = document.createElement("span");
  content.id = "toggleGifsContent";
  content.appendChild(resetButton);
  content.appendChild(pauseButton);
  overlay.appendChild(content);

  const offsetBase = el[ePositionAsIf] || el;
  function reposition() {
    let par = offsetBase.offsetParent;
    let x = offsetBase.offsetLeft;
    let y = offsetBase.offsetTop;

    // Skip past <td>s and <table>s, which appear in the offsetParent tree
    // despite not being positioned.
    while (
      par &&
      par.localName !== "body" &&
      window.getComputedStyle(par).position === "static"
    ) {
      x += par.offsetLeft;
      y += par.offsetTop;
      par = par.offsetParent;
    }

    par = par || document.body;
    const style = window.getComputedStyle(offsetBase);
    y += parseFloat(style.borderTopWidth);
    x += offsetBase.offsetWidth - parseFloat(style.borderLeftWidth);
    overlay.style.top = `${y}px`;
    overlay.style.left = `${x}px`;
    par.appendChild(overlay);
  }
  reposition();

  CurrentHover.overlay = overlay;

  const mo = new window.MutationObserver(reposition);
  mo.observe(el, { attributes: true });
  CurrentHover.mo = mo;
}

function clearHoverEffect() {
  if (!CurrentHover) return;
  const controller = CurrentHover;
  CurrentHover = null;
  controller.clearTimeouts();
  const el = controller.element;
  const { overlay } = controller;
  if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  if (controller.mo) controller.mo.disconnect();
  if (
    Prefs.hoverPauseWhen === HoverPause.Unhover &&
    controller.playing &&
    LastToggledImage === el
  ) {
    LastToggledImage = null;
    setAnimationState(el, "normal");
  }
  updateIndicator(el);
}

function handleImgHover(el) {
  if (isAnimatedImage(el)) applyHoverEffect(el);
  else HoveredNonanimatedImage = el;
}

function setTumblrRelatedImage(el) {
  if (el[eRelatedTo]) return true;
  let par = el;
  while (par && !(par.classList && par.classList.contains("post")))
    par = par.parentNode;
  par = par && par.getElementsByClassName("post_content")[0];
  const imDiv =
    par &&
    (par.querySelector("div.photo_stage_img") ||
      par.querySelector("div.post_thumbnail_container"));
  if (imDiv) {
    if (!imDiv[eFakeImage]) {
      const cs = window.getComputedStyle(imDiv);
      const bg = cs && cs.backgroundImage;
      if (!bg) return false;
      const r = /^url\("(.*)"\)$/.exec(bg);
      const src = r && r[1];
      if (!src) return false;

      // Now ideally we would replace tumblr's background-image-based thingy with
      // a real img tag. However, mimicking the exact positioning and clipping of the
      // image is difficult and fragile, so we abuse bug 332973 instead.
      const dummyImg = document.createElement("img");
      dummyImg.src = src;
      // imDiv.parentNode.replaceChild(dummyImg, imDiv);
      dummyImg.style.display = "none";
      dummyImg[ePositionAsIf] = imDiv;
      imDiv.appendChild(dummyImg);
      imDiv[eFakeImage] = dummyImg;
    }

    el.setAttribute(eRelatedTo, imDiv[eFakeImage]);
    return true;
  }
  const img = par && par.getElementsByTagName("img")[0];
  if (img) {
    el.setAttribute(eRelatedTo, img);
    return true;
  }
  return false;
}

function handlePinterestHover(el) {
  // Pinterest has their own GIF play buttons. Let them do their thing, and
  // auto-animate the image that appears after clicking "play".
  if (
    el[eHandledPinterest] ||
    !el.parentNode.querySelector(".playIndicatorPill.gifType")
  )
    return;
  el.setAttribute(eHandledPinterest, true);
  const img = el.parentNode.getElementsByTagName("img")[0];
  img.addEventListener("load", event => {
    if (!event.isTrusted) return;
    if (isAnimatedImage(img)) {
      setAnimationState(img, "normal");
      updateIndicator(img);
    } else {
      img[eAwaitingPlay] = true;
    }
  });
}

function partOfHoverTarget(el) {
  return (
    CurrentHover &&
    (el === CurrentHover.element ||
      el[eRelatedTo] === CurrentHover.element ||
      (el.id && el.id.startsWith("toggleGifs")))
  );
}

function onMouseOver(event) {
  if (!event.isTrusted) return;
  const el = event.target;
  const cl = el.className;

  let hasRelatedImage = false;
  if (
    IsTumblr &&
    [
      "post_controls_top",
      "post_tags_inner",
      "click_glass",
      "hover",
      "hover_inner",
      "post_date",
      "post_notes"
    ].includes(cl)
  ) {
    hasRelatedImage = setTumblrRelatedImage(el);
  }

  if (IsPinterest && (cl === "hoverMask" || cl === "playIndicatorPill")) {
    handlePinterestHover(el);
    return;
  }

  if (CurrentHover) {
    if (partOfHoverTarget(el)) {
      CurrentHover.clearTimeouts();
      return;
    }
    clearHoverEffect();
  }

  if (hasRelatedImage) handleImgHover(el[eRelatedTo]);
  else if (
    (el.tagName === "IMG" || isGifv(el)) &&
    el instanceof window.HTMLElement
  )
    handleImgHover(el);
}

function onMouseOut(event) {
  if (!event.isTrusted) return;
  HoveredNonanimatedImage = null;
  if (!CurrentHover || CurrentHover.mouseoutTimeout !== null) return;

  // Essentially we want to do clearHoverEffect here, since we unhovered an
  // animated image. However, the mouseout might be because we hovered over
  // one of the buttons, which we will know in a few milliseconds. Hence this
  // complicated logic.
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
  window.addEventListener("mouseover", onMouseOver);
  window.addEventListener("mouseout", onMouseOut);
}

function markAnimated(img) {
  if (img[eCheckedAnimation]) return;
  img.setAttribute(eCheckedAnimation, true);

  if (img[eAwaitingPlay]) setAnimationState(img, "normal");
  else if (WantedAnimationBehavior !== AnimationBehavior)
    setAnimationState(img, WantedAnimationBehavior);

  updateIndicator(img);

  if (HoveredNonanimatedImage === img) applyHoverEffect(img);
}

function handleLoad(el) {
  const callback = el[eOnLoad];
  if (callback) {
    el.setAttribut(eOnLoad, null);
    callback();
    return;
  }

  if (
    Prefs.playOnHover &&
    Prefs.hoverPlayOnLoad &&
    (Prefs.hoverPauseWhen === HoverPause.Never || LastToggledImage === el) &&
    el[eHasHovered] &&
    isAnimatedImage(el) &&
    getAnimationState(el) === "none"
  ) {
    setAnimationState(el, "normal");
    updateIndicator(el);
    if (CurrentHover) CurrentHover.refresh();
  }
}

function handleLoadedMetadata(el) {
  if (isGifv(el)) {
    if (el[eInitedGifv]) return;
    el.setAttribute(eInitedGifv, true);
    if (Prefs.defaultPaused) setAnimationState(el, "none");
    updateIndicator(el);
  }
}

// ==== Animation detection ====

function notifyAnimated(url) {
  console.info("content-script: found animated image", url);
  AnimatedMap.set(hash(url), 1);
  SeenAnyAnimated = true;

  document.getElementsByTagName("img").forEach(img => {
    if (img.src === url) markAnimated(img);
  });
}

function checkAnimated(img) {
  const url = img.src;
  const key = hash(url);
  const v = AnimatedMap.get(key);
  if (v === 1) {
    markAnimated(img);
  } else if (v !== 2) {
    AnimatedMap.set(key, 2);
    browser.runtime
      .sendMessage({ type: "query-animated", url })
      .catch(e => console.error(e));
  }
}

function handleLoadStart(img) {
  checkAnimated(img);
}

// ==== Initialization ====

function updatePref(pref, value) {
  console.info("updated setting", pref, value);
  const last = Prefs[pref];
  Prefs[pref] = value;
  if (pref === "shortcutReset" || pref === "shortcutToggle")
    updateKeyListeners();
  if (pref === "hoverPauseWhen") updateClickListeners();
  if (pref === "showOverlays" && !value) clearHoverEffect();
  if (pref === "indicatorStyle") updateAllIndicators(last, value);
}

function init() {
  // Don't do *anything* if this frame is a dummy frame created by ourselves.
  const fr = window.frameElement;
  if (fr && fr.hasAttribute("toggle-gifs-frame")) return;

  const settingsPromise = browser.storage.local
    .get(defaultPrefs)
    .then(data => {
      Prefs = data;
    })
    .catch(e => {
      throw new Error(`unable to read prefs: ${String(e)}`);
    });

  const animationBehaviorPromise = sendMessageWithRetry({
    type: "query-animation-behavior"
  }).then(behavior => {
    // Assume 'behavior', as just queried from the global pref, is correct
    // for our presContext. This should hold with >99% probability.
    AnimationBehavior = behavior;
    WantedAnimationBehavior = AnimationBehavior;
  });

  const loadedPromise = Promise.all([
    settingsPromise,
    animationBehaviorPromise
  ]);

  let inited = false;
  let loadQueue = [];
  function callWhenLoaded(callback) {
    if (inited) callback();
    else loadQueue.push(callback);
  }

  settingsPromise.then(() => {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;

      changes.forEach(pref => {
        if (pref in defaultPrefs) {
          const val = changes[pref].newValue;
          if (inited) {
            updatePref(pref, val);
          } else {
            Prefs[pref] = val;
          }
        }
      });
    });
  });

  function onLoadStart(event) {
    const el = event.target;
    if (event.isTrusted && el.tagName === "IMG")
      callWhenLoaded(() => handleLoadStart(el));
  }

  function onLoad(event) {
    const el = event.target;
    if (event.isTrusted && el.tagName === "IMG")
      callWhenLoaded(() => handleLoad(el));
  }

  function onLoadedMetadata(event) {
    if (event.isTrusted)
      callWhenLoaded(() => handleLoadedMetadata(event.target));
  }

  document.addEventListener("loadstart", onLoadStart, true);
  document.addEventListener("load", onLoad, true);
  window.addEventListener("loadedmetadata", onLoadedMetadata, true);

  loadedPromise.then(() => {
    console.info("content-script init", AnimationBehavior);
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

    loadQueue.forEach(callback => {
      try {
        callback();
      } catch (e) {
        console.error(e);
      }
    });
    loadQueue = null;
  });
}

init();
