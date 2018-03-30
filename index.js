const {main} = require('junk-drawer')
const {version} = require('./package')
const {StreamService} = require('syslogd')
const Future = require('junk-drawer/future')
const {Bumper} = require('./bumper')
const EventEmitter = require('events');

const net = require('net')

class RFC5424StructuredWriter extends EventEmitter {
	constructor( target_port, target_host, logger = console) {
		super();
		this.target_port = target_port;
		this.target_host = target_host;
		this.logger = logger;
		this.written = 0;
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
				this.logger.error("Socket connection error", {problem, bytesWritten: this.written});
			})
			this.logger.info("Connecting to remote target", {host: this.target_host, port: this.target_port});
			socket.connect( this.target_port, this.target_host, () => {
				this.written = 0;
				this.logger.info("Connected to remote target", {host: this.target_host, port: this.target_port});
				this.emit("connected", { socket });
				future.accept( socket );
			});
			this.last_op = future.promised;
			return this.onConnection(frameBuilder);
		}
	}

	_scheduleAfter(socket, frameBuilder) {
		const frame = frameBuilder();
		const length = frame.length;
		this.written += length;
		this.logger.debug("Writing bytes to socket", {length: frame.length});
		if( socket.write(frame) ) {
			this.logger.debug("Write accepted by the kernel");
			return socket;
		} else {
			this.logger.info("Write draining.");
			const future = new Future();
			socket.once('drain', () => {
				this.logger.info("Write drained.");
				future.accept( socket );
			});
			this.last_op = frame.promised;
			return future.promised;
		}
	}

	async send_frame( frame ){
		const write = this.onConnection( () => {
			this.logger.info("Preparing the frame for write.");
			const wireFrame = "" +frame.size + " " + frame.msg;
			return wireFrame;
		});
		return write;
	}

	end() {
		const done = new Future()
		if( this.last_op ) {
			this.logger.info("Asked to terminate teh socket");
			this.last_op.then( (socket) => {
				this.logger.info("Terminating the socket", {bytesWritten: this.written});
				socket.once('close', () => { done.accept(false) });
				socket.end()
			})
		} else {
			this.logger.info("Socket not open or no pending writes.");
			done.accept(true)
		}
		return done.promised
	}
}

function tcp_incremental_send( target_port, target_host, logger = console ){
	return function() {
		const writer = new RFC5424StructuredWriter( target_port, target_host, logger )
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
		const factory = tcp_incremental_send(egressPort, egressHost, logger);
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