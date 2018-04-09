const os = require('os');

function formatSyslogMessage( record ) {
	const tag = record.tag || "tag";
	const host = record.hostname || os.hostname();
	return  [ host, tag ].join(" ") + ": " + record.msg;
}

module.exports = {
	formatSyslogMessage
}
