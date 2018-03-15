const Future = require('junk-drawer/future')
const net = require('net')

function promise_write_completed( sink, content ) {
	if( !sink ){ throw new Error("Sink may not be falsy"); }

	const future = new Future()
	if( sink.write( content ) ) {
		future.accept( sink );
	} else {
		sink.once( 'drain', () => {
			future.accept( sink );
		});
	}
	return future.promised;
}

class TCPPromisedSink {
	constructor( host, port ) {
		this.host = host;
		this.port = port;
		this.last_op = undefined;
	}

	_last_op(){
		if( !this.last_op ) {
			//Connect
			const future = new Future()
			const socket = new net.Socket();
			console.log("Connecting to ", this.host, this.port)
			socket.connect(this.port, this.host, () => {
				console.log("connected", this.host, this.port)
				future.accept(socket);
			});
			socket.on('error', (problem) => {
				console.error("Socket encountered an error", problem)
				this.last_op = undefined;
			})
			this.last_op = future.promised;
		}
		return this.last_op;
	}

	async write( content ) {
		const sink = await this._last_op();
		this.last_op = promise_write_completed( sink, content );
		return this.last_op;
	}

	end() {
		const done = new Future()
		if( this.last_op ) {
			this.last_op.then( (socket) => {
				socket.once('close', () => { done.accept(false) });
				socket.end()
			})
		} else {
			done.accept(true)
		}
		return done.promised
	}
}

/**
 * A Bumper is a method of queuing messages to be written out to a target.
 */
class Bumper {
	constructor( factory ){
		this.pending = [];
		this.factory = factory;
		this.is_consuming = false;
	}

	consume(){
		if( this.is_consuming ) { return false; }
		this.is_consuming = true;

		this._consume_internal().then( (count) => {
			this.is_consuming = false;
		}, (error) => {
			this.is_consuming = false;
		})
	}

	async _consume_internal(){
		const drain = this.factory()
		let count = 0, last_count;
		do {
			last_count = await this._consume_all_messages(drain);
			var delay = new Future();
			setTimeout( () => {
				delay.accept();
			}, 10);
			await delay.promised
			count += last_count
		} while( last_count > 0);
		await drain.end();
		return count
	}

	async _consume_all_messages(drain) {
		var count = 0;
		while( this.pending.length > 0){
			await this._consume_element( drain )
			count++
		}
		return count;
	}

	async _consume_element( drain ){
		const envelope = this.pending[0];
		const result = await drain.consume( envelope.message )
		this.pending.splice(0,1)
		if( envelope.completion ) {
			envelope.completion.accept( result );
		}
	}

	publish( message, promise = true ){
		const completion = promise ? new Future() : null;
		const envelope = {completion, message }
		this.pending.push(envelope);
		this.consume();
		return promise ? completion.promised : null;
	}
}

module.exports = {
	Bumper,
	TCPPromisedSink
}
