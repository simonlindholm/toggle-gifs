/* global console, browser, setTimeout, clearTimeout */
/* eslint new-cap: off */
"use strict";

// Max memory usage: (200 + 200) * 500 bytes = 200 kB; less in practice.
// Plus information about the waiting tabs, and data structure overhead.
var LRU_CACHE_SIZE = 200;
var LRU_WAITING_SIZE = 200;
var MAX_URL_SIZE = 500;
var QUEUE_MAX_TIME = 2000;

var DefaultAnimationBehavior = null;
var CurrentAnimationBehavior = null;

function isDataUrl(url) {
	return url.startsWith("data:");
}

function invertBehavior(value) {
	return value === "none" ? "normal" : "none";
}

function notifyAnimated(who, url) {
	let msg = {type: "notify-animated", url};
	browser.tabs.sendMessage(who.tabId, msg, {frameId: who.frameId})
		.catch(e => console.error(e));
}

var AnimatedUrlCache = {
	entries: new Set(),
	waiting: new Map(),

	insert(url) {
		if (url.length > MAX_URL_SIZE)
			return;
		if (this.entries.has(url)) {
			// Maintain LRU order.
			this.entries.delete(url);
			this.entries.add(url);
		} else {
			this.entries.add(url);
			if (this.entries.length > LRU_CACHE_SIZE)
				this.evict(this.entries, (LRU_CACHE_SIZE * 3) >> 2);

			let w = this.waiting.get(url);
			if (w) {
				this.waiting.delete(url);
				for (let who of w)
					notifyAnimated(who, url);
			}
		}
	},

	evict(map, keep) {
		var ind = 0, del = map.length - keep, ar = [], key;
		for (key of map.keys()) {
			if (++ind > del) break;
			ar.push(key);
		}
		for (key of ar)
			map.delete(key);
	},

	checkAnimated(who, url) {
		if (isDataUrl(url)) {
			// TODO! (Either data URLs are not passed through webRequest, in
			// which case we need to do GIF parsing here or in the child
			// process, or they are, and we need to crop them.)
		} else {
			if (this.entries.has(url)) {
				// Maintain LRU order.
				this.entries.delete(url);
				this.entries.add(url);
				notifyAnimated(who, url);
			} else {
				let w = this.waiting.get(url);
				if (w) w.push(who);
				else this.waiting.set(url, [who]);
				if (this.waiting.length > LRU_WAITING_SIZE)
					this.evict(this.waiting, (LRU_WAITING_SIZE * 3) >> 2);
			}
		}
	},
};

var TemporaryQueue = {
	state: "default", // default | changed | transition
	// TODO: save temporary setting

	queues: {
		default: [],
		changed: []
	},

	blockers: new Map(),

	push(wanted, key, callback) {
		let tp = (wanted === DefaultAnimationBehavior ? "default" : "changed");
		this.queues[tp].push({key, callback});
		this.work();
	},

	work() {
		if (this.state === "transition")
			return;
		for (let item of this.queues[this.state]) {
			let key = item.key;
			var timeout = setTimeout(() => {
				// Revert the change after a timeout, e.g. if the tab gets
				// closed at just the wrong moment.
				console.warn("Reverting animation mode change after timeout");
				this.blockers.delete(key);
				this.work();
			}, QUEUE_MAX_TIME);
			this.blockers.set(key, {timeout});
			try {
				item.callback();
			} catch (ex) {
				// Not our or the caller's fault if this throws an exception!
				console.error(ex);
			}
		}
		this.queues[this.state] = [];

		if (this.blockers.size === 0 && (this.state === "changed" ||
					this.queues.changed.length > 0)) {
			let newState = (this.state === "changed" ? "default" : "changed");
			this.state = "transition";
			let behavior = (newState === "default"
					? DefaultAnimationBehavior
					: invertBehavior(DefaultAnimationBehavior));
			browser.browserSettings.imageAnimationBehavior.set({value: behavior})
				.then(() => {
					this.state = newState;
					this.work();
				})
				.catch(e => console.error(e));
		}
	},

	done(key) {
		let entry = this.blockers.get(key);
		if (entry) {
			this.blockers.delete(key);
			clearTimeout(entry.timeout);
			this.work();
		}
	},
};

function *gifDecoder($) {
	var size, r, len;

	// Header
	if ($.avail < 6) yield $.Ensure(6);
	var header = $.read(6);
	if (header[0] !== 0x47 || header[1] !== 0x49 || header[2] !== 0x46)
		return $.Error("not a gif");
	if (header[3] !== 0x38 || header[5] !== 0x61 || (header[4] !== 0x37 && header[4] !== 0x39))
		return $.Error("unrecognized version");

	// Metadata
	if ($.avail < 7) yield $.Ensure(7);
	$.skip(4); // size
	var bits = $.read1(); // has gct, color resolution, sorted, gct size
	$.skip(2); // background color, aspect ratio

	// GCT
	if (bits & 0x80) {
		size = 3 << ((bits & 0x7) + 1);
		r = $.longSkip(size);
		if (r) yield r;
	}

	var atLeastOneImage = false;
	for (;;) {
		if ($.avail < 1) yield $.Ensure(1);
		var type = $.read1();

		// Extension block
		if (type === 0x21) {
			if ($.avail < 2) yield $.Ensure(2);
			type = $.read1();
			len = $.read1();
			if (len === 0) {
				// do nothing, per fx impl
			} else if (type === 0xf9) { // gce
				// again per fx impl, read max(len, 4) bytes, and process the first 4
				len = Math.max(len, 4);
				if ($.avail < len + 1) yield $.Ensure(len + 1);
				// 1 byte: reversed, disposal method, user input, transparency
				// 2 bytes: frame duration
				// 1 byte: transparency index
				// Firefox claims that images are animated if they have a non-zero
				// duration, but that gives quite a few false positives.
				$.skip(len);
				len = $.read1();
			} else if (type === 0xff && len === 11) {
				if ($.avail < 12) yield $.Ensure(12);
				var ext = $.read(11), exts = "";
				for (var i = 0; i < 11; i++)
					exts += String.fromCharCode(ext[i]);
				len = $.read1();
				if (exts === "NETSCAPE2.0" || exts === "ANIMEXTS1.0") {
					while (len) {
						len = Math.max(len, 3);
						if ($.avail < len + 1) yield $.Ensure(len + 1);
						var subid = $.read1() & 0x7;
						if (subid === 1) {
							$.readU16(); // iteration count, 0 = inf
						} else if (subid !== 2) {
							return $.Error("invalid NETSCAPE subblock id");
						}
						if (len > 3) $.skip(len - 3); // padding
						len = $.read1();
					}
				}
			}
			// Skip over trailing data and extensions that did not match anything
			// above, per fx impl.
			while (len) {
				if ($.avail < len + 1) yield $.Ensure(len + 1);
				$.skip(len);
				len = $.read1();
			}
		}

		// Image
		else if (type === 0x2c) {
			if (atLeastOneImage) // per fx impl
				return $.FoundAnimation();
			atLeastOneImage = true;

			// Metadata
			if ($.avail < 9) yield $.Ensure(9);
			$.skip(8); // x, y, width, height
			bits = $.read1(); // has lct, interlaced, (unused bits), lct size

			// LCT
			if (bits & 0x80) {
				size = 3 << ((bits & 0x7) + 1);
				r = $.longSkip(size);
				if (r) yield r;
			}

			if ($.avail < 2) yield $.Ensure(2);
			$.skip(1); // lzw data size

			// Actual LZW-coded image, split into blocks. Skip it.
			len = $.read1();
			while (len) {
				r = $.longSkip(len);
				if (r) yield r;
				if ($.avail < 1) yield $.Ensure(1);
				len = $.read1();
			}
		}

		// Trailer
		else if (type === 0x3b) {
			break;
		}

		// Unrecognized segment type
		else {
			// per fx impl, allow this error if we have found an image
			if (atLeastOneImage)
				break;
			return $.Error("unrecognized segment type");
		}
	}

	// Trailing junk is OK according to imagelib. We're done here.
	return $.Done();
}

function setFilterHandlers(filter, url, decoder, foundAnimation) {
	var $ = {
		avail: 0,
		index: 0,
		skipping: 0,
		leftovers: null,
		bytearray: null,

		Ensure(n) {
			return {type: 0, n, skip: false};
		},

		Error(msg) {
			return {type: 1, msg};
		},

		FoundAnimation() {
			return {type: 2};
		},

		Done() {
			return {type: 3};
		},

		feed(arr) {
			if (!arr.length)
				return;
			if (this.skipping) {
				if (this.skipping >= arr.length) {
					this.skipping -= arr.length;
					return;
				}
				arr = arr.subarray(this.skipping);
				this.skipping = 0;
			}

			if (this.bytearray !== null) {
				if (this.leftovers === null) {
					if (this.avail !== 0)
						this.leftovers = this.bytearray.subarray(this.index);
				} else {
					var buffer = new Uint8Array(new ArrayBuffer(this.avail));
					buffer.set(this.leftovers);
					buffer.set(this.bytearray.subarray(this.index), this.leftovers.length);
					this.leftovers = buffer;
				}
			}
			this.bytearray = arr;
			this.index = 0;
			this.avail += arr.length;
		},

		longSkip(n) {
			if (this.avail < n) {
				n -= this.avail;
				this.avail = 0;
				this.index = 0;
				this.leftovers = null;
				this.bytearray = null;
				this.skipping = n;
				return this.Ensure(n);
			}
			$.skip(n);
			return null;
		},

		read(n) {
			var ret;
			this.avail -= n;
			if (this.avail < 0) {
				throw new Error("must ensure space before reading!");
			}

			if (this.leftovers !== null) {
				if (n <= this.leftovers.length) {
					ret = this.leftovers.subarray(0, n);
					this.leftovers = (n === this.leftovers.length ? null : this.leftovers.subarray(n));
				} else {
					this.index = n - this.leftovers.length;
					ret = new Uint8Array(new ArrayBuffer(n));
					ret.set(this.leftovers);
					ret.set(this.bytearray.subarray(0, this.index), this.leftovers.length);
					this.leftovers = null;
				}
			} else {
				this.index += n;
				ret = this.bytearray.subarray(this.index - n, this.index);
			}
			return ret;
		},

		skip(n) {
			this.avail -= n;
			if (this.avail < 0) {
				throw new Error("must ensure space before reading!");
			}

			if (this.leftovers !== null) {
				if (n < this.leftovers.length) {
					this.leftovers = this.leftovers.subarray(n);
				} else {
					this.index = n - this.leftovers.length;
					this.leftovers = null;
				}
			} else {
				this.index += n;
			}
		},

		read1() {
			var ret;
			this.avail -= 1;
			if (this.avail < 0) {
				throw new Error("must ensure space before reading!");
			}

			if (this.leftovers !== null) {
				ret = this.leftovers[0];
				this.leftovers = (this.leftovers.length === 1 ? null : this.leftovers.subarray(1));
			} else {
				ret = this.bytearray[this.index];
				this.index += 1;
			}
			return ret;
		},

		readU16() {
			var a = this.read1();
			var b = this.read1();
			return a | (b << 8);
		},
	};

	var dec = decoder($);
	var waitingFor = 0;

	function done() {
		filter.disconnect();
		$.leftovers = null;
		$.bytearray = null;
	}

	filter.ondata = function handleData(event) {
		// Gets fed with ~10 kB of data at a time.
		let arr = event.data;
		filter.write(arr);
		if (!arr.byteLength) return;
		arr = new Uint8Array(arr);

		$.feed(arr);
		while ($.avail >= waitingFor) {
			var r = dec.next();
			var s = r.value;
			if (s.type === 0) {
				waitingFor = s.n;
				if ($.avail >= waitingFor)
					throw new Error("yielded despite being able to continue");
			} else if (s.type === 1) {
				console.log("error in image decode: " + s.msg + " on " + url);
				done();
				return;
			} else if (s.type === 2) {
				foundAnimation();
				done();
				return;
			} else if (s.type === 3) {
				// successful parse
				done();
				return;
			} else {
				throw new Error("unknown event type " + s.type);
			}
		}
	};

	// We *could* set filter.onstop here, and do some processing for cases
	// with truncated GIFs. But I think imagelib accepts those, so we don't.
	// Well, maybe the resulting image is an error one, but at least the
	// parsing seems to succeed from what I can tell from the source.
}

function isGif(req) {
	if (req.url.includes(".gif")) {
		// Some GIFs have an invalid content-type; heuristically detect them
		// based on URL instead. (We could try to parse every image as a GIF,
		// but that adds more overhead.)
		return true;
	}
	for (let header of req.responseHeaders) {
		if (header.name.toLowerCase() === "content-type")
			return (header.value === "image/gif");
	}
	return false;
}

function requestListener(req) {
	var status = req.statusCode;
	if (200 <= status && status < 300 && isGif(req)) {
		var url = req.url;
		// XXX Does req.url take redirects into account, or do I need to hook
		// onBeforeRedirect as well? (And check requestId's. With expiry on
		// onErrorOccurred.)
		let filter = browser.webRequest.filterResponseData(req.requestId);
		setFilterHandlers(filter, url, gifDecoder, () => {
			console.log("found animated image " + url);
			AnimatedUrlCache.insert(url);
		});
	}
	return {};
}

browser.webRequest.onHeadersReceived.addListener(
	requestListener,
	{urls: ["<all_urls>"], types: ["image", "imageset"]},
	["blocking", "responseHeaders"]
);

let animationBehaviorPromise =
	browser.browserSettings.imageAnimationBehavior.get({})
		.then(({value}) => {
			if (DefaultAnimationBehavior === null) {
				DefaultAnimationBehavior = value;
				CurrentAnimationBehavior = value;
			}
		})
		.catch(e => {
			throw new Error("unable to read image animation behavior: " + String(e));
		});

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.type === "query-animated") {
		let who = {tabId: sender.tab.id, frameId: sender.frameId};
		AnimatedUrlCache.checkAnimated(who, msg.url);
	} else if (msg.type === "query-animation-behavior") {
		if (CurrentAnimationBehavior === null) {
			animationBehaviorPromise.then(() => {
				sendResponse(CurrentAnimationBehavior);
			});
			return true;
		}
		sendResponse(CurrentAnimationBehavior);
	} else if (msg.type === "temporary-behavior") {
		if (DefaultAnimationBehavior === null)
			throw new Error("content-script must init before changing behavior");
		var key = msg.key, wanted = msg.value;
		TemporaryQueue.push(wanted, key, () => {
			sendResponse();
		});
		return true;
	} else if (msg.type === "done-temporary-behavior") {
		TemporaryQueue.done(msg.key);
	} else if (msg.type === "updated-pref") {
		console.log("updated pref", msg.pref, msg.value);
		if (msg.pref === "animation-behavior") {
			DefaultAnimationBehavior = msg.value;
			CurrentAnimationBehavior = msg.value;
		}
	} else {
		throw new Error("unknown message type");
	}
	return false;
});
