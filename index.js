const {main} = require('junk-drawer')
const {version} = require('./package')
const {StreamService} = require('syslogd')
const Future = require('junk-drawer/future')
const {Bumper} = require('./bumper')

const net = require('net')
class RFC5424StructuredWriter {
	constructor( target_port, target_host ) {
		this.target_port = target_port;
		this.target_host = target_host;
		this.written = 0
	}

	onConnection( frameBuilder ) {
		if( this.last_op ){
			const op = this.last_op.then( ( socket ) => {
				return this._scheduleAfter(socket, frameBuilder);
			})
			this.last_op = op;
			return op;
		} else {
			const future = new Future()
			const socket = new net.Socket();
			socket.on('error', (problem) =>{
				console.error("Socket error encountered", problem)
			})
			socket.connect( this.target_port, this.target_host, () => {
				future.accept( socket );
			});
			this.last_op = future.promised;
			return this.onConnection(frameBuilder);
		}
	}

	_scheduleAfter(socket, frameBuilder) {
		const frame = frameBuilder();
		this.written += frame.length
		if( socket.write(frame) ) {
			return socket;
		} else {
			const future = new Future();
			socket.once('drain', () => {
				future.accept( socket );
			});
			this.last_op = frame.promised;
			return future.promised;
		}
	}

	async send_frame( frame ){
		const write = this.onConnection( () => {
			const wireFrame = "" +frame.size + " " + frame.msg;
			return wireFrame;
		});
		return write;
	}

	end() {
		const done = new Future()
		if( this.last_op ) {
			this.last_op.then( (socket) => {
				console.log("Bytes written: ", this.written)
				socket.once('close', () => { done.accept(false) });
				socket.end()
			})
		} else {
			done.accept(true)
		}
		return done.promised
	}
}

function tcp_incremental_send( target_port, target_host ){
	return function() {
		const writer = new RFC5424StructuredWriter( target_port, target_host )
		return {
			end: function() {
				return writer.end();
			},
			consume: function (frame) {
				return writer.send_frame(frame);
			}
		}
	}
}

if (require.main === module) {
	main(async (logger) => {
		logger.info("Log Bumper v" + version);

		const egressPort = 8514;
		const egressHost = "localhost";
		const factory = tcp_incremental_send(egressPort, egressHost);
		const exchange_point = new Bumper(factory);


		const ingressPort = 10105;
		StreamService((frame) => {
			exchange_point.publish(frame);
		}, {}).listen(ingressPort, () => {
			logger.info("Listening on ", ingressPort);
		});
	});
} else {
	module.exports = {
		tcp_incremental_send,
		Bumper
	}
}