/* eslint-env browser */
/* global browser */

// Keep in sync with content-script.js!
const DefaultPrefs = {
  hoverPauseWhen: 1,
  hoverPlayOnLoad: false,
  indicatorStyle: 0,
  playOnHover: false,
  shortcutReset: "",
  shortcutToggle: "",
  showOverlays: true,
  supportGifv: true
};

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
// end keep in sync

let Prefs = null;

const loadPromise = new Promise(resolve => {
  window.addEventListener("load", resolve, false);
});

const animationBehaviorPromise = browser.browserSettings.imageAnimationBehavior
  .get({})
  .then(({ value }) => value)
  .catch(e => {
    throw new Error(`unable to read image animation behavior: ${String(e)}`);
  });

function setPref(pref, value) {
  if (!(pref in Prefs)) throw new Error(`changed unknown pref ${pref}`);
  Prefs[pref] = value;
  browser.storage.local
    .set({ [pref]: value })
    .then(() => {
      browser.runtime.sendMessage({
        type: "updated-pref",
        pref,
        value
      });
    })
    .catch(e => console.error(e));
}

function handleShortcutKeyDown(event) {
  const el = event.target;
  if (event.which === 8) {
    // Clear on backspace.
    el.value = "";
  } else {
    const str = keyDownEventToString(event);
    if (!str) return;
    el.value = str;
  }

  const pref = el.getAttribute("data-pref");
  const { value } = el;
  setPref(pref, value);
  event.preventDefault();
  event.stopPropagation();
}

function handleBoolIntChange(event) {
  const el = event.target;
  const pref = el.getAttribute("data-pref");
  const value = el.checked ? 1 : 0;
  setPref(pref, value);
}

function handleBoolChange(event) {
  const el = event.target;
  const pref = el.getAttribute("data-pref");
  const value = el.checked;
  setPref(pref, value);
}

function handleRadioChange(event) {
  const el = event.target;
  const pref = el.name;
  const { value } = el;
  setPref(pref, +value);
}

const settingsPromise = browser.storage.local
  .get(DefaultPrefs)
  .then(data => {
    Prefs = data;
  })
  .catch(e => {
    throw new Error(`unable to read prefs: ${String(e)}`);
  });

Promise.all([loadPromise, settingsPromise, animationBehaviorPromise])
  .catch(e => {
    document.body.textContent = "Unable to load preferences :(";
    document.body.hidden = false;
    throw e;
  })
  .then(([, , behavior]) => {
    // Special: pause-by-default uses the global animation behavior setting
    const pauseEl = document.getElementById("pause-by-default");
    pauseEl.checked = behavior === "none";
    pauseEl.onchange = () => {
      const value = this.checked ? "none" : "normal";
      browser.browserSettings.imageAnimationBehavior
        .set({ value })
        .catch(e => console.error(e));
      browser.runtime
        .sendMessage({
          type: "updated-pref",
          pref: "animation-behavior",
          value
        })
        .catch(e => console.error(e));
    };

    // Radio buttons, currently just with int values
    ["hoverPauseWhen"].forEach(pref => {
      const els = document.getElementsByName(pref);
      const val = Prefs[pref];

      els.forEach(el => {
        el.setAttribute("checked", el.value === val);
        el.addEventListener("change", handleRadioChange, false);
      });
    });

    // All other kinds of prefs
    document.querySelectorAll("[data-pref]").forEach(el => {
      const name = el.getAttribute("data-pref");
      const type = el.getAttribute("data-type");
      const pr = Prefs[name];

      if (type === "shortcut") {
        if (typeof pr !== "string") throw new Error("must be a string pref");
        el.addEventListener("keydown", handleShortcutKeyDown, false);
        el.setAttribute("value", pr);
      } else if (type === "boolint") {
        if (typeof pr !== "number") throw new Error("must be an int pref");
        el.addEventListener("change", handleBoolIntChange, false);
        el.setAttribute("checked", pr !== 0);
      } else if (el.type === "checkbox") {
        if (typeof pr !== "boolean") throw new Error("must be a bool pref");
        el.addEventListener("change", handleBoolChange, false);
        el.setAttribute("checked", pr);
      } else {
        throw new Error(`unrecognized ${name}`);
      }
    });

    document.body.hidden = false;
  });
