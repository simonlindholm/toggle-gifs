/* global console, browser */
/* eslint new-cap: off */
"use strict";

// Max memory usage: (200 + 200) * 500 bytes = 200 kB; less in practice.
// Plus information about the waiting tabs, and data structure overhead.
var LRU_CACHE_SIZE = 200;
var LRU_WAITING_SIZE = 200;
var MAX_URL_SIZE = 500;

function sendMessageToActiveTab(msg) {
	browser.tabs.query({
		active: true,
		currentWindow: true,
	}).then(tabs =>
			Promise.all(tabs.map(tab =>
				browser.tabs.sendMessage(tab.id, msg))))
		.catch(console.error);
}

function isDataUrl(url) {
	return url.startsWith("data:");
}

function notifyAnimated(who, url) {
	let msg = {type: "notify-animated", url};
	browser.tabs.sendMessage(who.tabId, msg, {frameId: who.frameId})
		.catch(console.error);
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
				$.skip(1); // reversed, disposal method, user input, transparency
				var dur = $.readU16();
				$.skip(len - 3); // transparency index, dummy padding
				if (dur)
					return $.FoundAnimation();
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
			if ($.avail < 7) yield $.Ensure(7);
			$.skip(4); // size
			bits = $.read1(); // has lct, interlaced, (unused bits), lct size
			$.skip(2); // background color, aspect ratio

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
	for (let header of req.responseHeaders) {
		if (header.name.toLowerCase() === "content-type")
			return (header.value === "image/gif");
	}
	return false;
}

function requestListener(req) {
	let status = req.statusCode;
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

// TODO commands for shortcuts, or listen in content script
/*
browser.commands.onCommand.addListener(function(command) {
	if (command == "toggle-gifs") {
		console.log("ctrl+m pressed");
		sendMessageToActiveTab({type: "toggle-gifs"});
	} else if (command == "reset-gifs") {
		console.log("shift+m pressed");
		sendMessageToActiveTab({type: "reset-gifs"});
	}
});
*/

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	void sendResponse;
	if (msg.type === "query-animated") {
		let who = {tabId: sender.tab.id, frameId: sender.frameId};
		AnimatedUrlCache.checkAnimated(who, msg.url);
	} else {
		throw new Error("unknown message type");
	}
});
