// WTFPL
var EXPORTED_SYMBOLS = ["cancelEvent", "keyDownEventToString"];

function cancelEvent(event) {
	event.stopPropagation();
	event.preventDefault();
}

function keyDownEventToString(event) {
	function keyToString(event) {
		if (event.which === 19)
			return "Pause";
		if (event.which === 27)
			return "Esc";
		if (event.which === 32)
			return "Space";
		if (event.which < 32)
			return null;
		var key = event.key;
		// Firefox 24 shows MozPrintableKey for all printable keys...
		// http://lists.w3.org/Archives/Public/www-dom/2013AprJun/0079.html
		if (!key || key === "MozPrintableKey")
			key = String.fromCharCode(event.which);
		return (key.length === 1 ? key.toUpperCase() : key);
	}
	function accelToString(event) {
		var accel = "";
		if (event.ctrlKey) accel += "Ctrl+";
		if (event.metaKey) accel += "Meta+";
		if (event.shiftKey) accel += "Shift+";
		if (event.altKey) accel += "Alt+";
		return accel;
	}

	var key = keyToString(event), accel = accelToString(event);
	return key ? accel + key : "";
}

