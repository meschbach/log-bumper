const mocha = require('mocha');
const assert = require('assert');
const os = require('os');

//testing
const {ConnectionState} = require('syslogd');
function parseFrame( message ) {
	let record;
	const service = {
		handler: (parsedRecord) => {
			record = parsedRecord
		}
	}
	const parser = new ConnectionState(service, {remoteAddress: '172.18.0.2', remotePort: 1234, remoteFamily: 'TCP4'});
	const buffer = Buffer.from(message, "UTF-8");
	parser.more_data( buffer );
	parser.closed()
	return record;
}

//subject under test
const {formatSyslogMessage} = require("../rfc5424")

describe( "formatSyslogMessage", function () {
	describe("with a full record", () => {
		const msg = "ladidadidldad be optimistic";
		const hostname = "chap";

		beforeEach(function () {
			this.result = formatSyslogMessage({hostname, msg});
			this.record = parseFrame(this.result);
			assert(this.record, "Failed to parse record");
		});

		it("has the correct message", function () {
			assert.deepEqual( this.record.msg, msg)
		});

		it( "has the host name", function () {
			assert.deepEqual(this.record.hostname, hostname);
		});
	})

	describe("when lacking a host header", () => {
		const msg = "ladidadidldad be optimistic";

		beforeEach(function () {
			this.result = formatSyslogMessage({msg});
			this.record = parseFrame(this.result);
			assert(this.record, "Failed to parse record");
		});


		it("has the correct message", function () {
			assert.deepEqual( this.record.msg, msg)
		});

		it( "uses this machines name", function () {
			assert.deepEqual(this.record.hostname, os.hostname());
		});
	})
} );
