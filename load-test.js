const {main} = require('junk-drawer')
const {version} = require('./package')

const {Bumper, TCPPromisedSink} = require('./bumper')
const {Metric, completions_per_n_seconds} = require('./metric')

function tcp_sink( host, port ){
	return function() {
		const sink = new TCPPromisedSink( host, port );
		return {
			end: function() {
				return sink.end()
			},
			consume: function( content ){
				return sink.write( content );
			}
		}
	}
}

async function run_test( logger ) {
	const port = 10105;
	const host = 'localhost';

	logger.info("Targeting port ", port);
	const buffer = new Bumper(tcp_sink( host, port), console);
	const promises = []
	const monitor =  new Metric()
	const buildStart = Date.now()
	/*
	for( let i = 0; i < 100000; i++){
		const done = buffer.publish("Test " + i + "\n")
		monitor.promise_completion( done );
		promises.push(done)
	}
	*/
	for( let i = 0; i < 50000 ; i++){
		const message = "ancient alien electromagnetic foo fighter space travel weightless foo fighter, targeted mutation ancient alien choral castle burmuta triangle, star people astronaut mercury technology space time . targeted mutation mainstream archaelogy cover up pyramids flying vessels, crystal skull clearly ancient alien mainstream archaelogy, targeted mutation . i know it sounds crazy... Flying vessels astronaut targeted mutation ancient god space time, sumerian texts gods burmuta triangle grey nazca lines ancient religions, mahabharata star gates technology cover up choral castle. electromagnetic otherworldly visitors mercury space brothers mercury grey , king soloman dna manipulation elongated skull targeted mutation legendary times, machu picchu sumerian texts anti-gravity helicopter heiroglyph. ancient alien electromagnetic foo fighter space travel weightless foo fighter, targeted mutation ancient alien choral castle burmuta triangle, star people astronaut mercury technology space time . targeted mutation mainstream archaelogy cover up pyramids flying vessels, crystal skull clearly ancient alien mainstream archaelogy, targeted mutation . i know it sounds crazy... Flying vessels astronaut targeted mutation ancient god space time, sumerian texts gods burmuta triangle grey nazca lines ancient religions, mahabharata star gates technology cover up choral castle. electromagnetic otherworldly visitors mercury space brothers mercury grey , king soloman dna manipulation elongated skull targeted mutation legendary times, machu picchu sumerian texts anti-gravity helicopter heiroglyph. ancient alien electromagnetic foo fighter space travel weightless foo fighter, targeted mutation ancient alien choral castle burmuta triangle, star people astronaut mercury technology space time . targeted mutation mainstream archaelogy cover up pyramids flying vessels, crystal skull clearly ancient alien mainstream archaelogy, targeted mutation . i know it sounds crazy... Flying vessels astronaut targeted mutation ancient god space time, sumerian texts gods burmuta triangle grey nazca lines ancient religions, mahabharata star gates technology cover up choral castle. electromagnetic otherworldly visitors mercury space brothers mercury grey , king soloman dna manipulation elongated skull targeted mutation legendary times, machu picchu sumerian texts anti-gravity helicopter heiroglyph. ancient alien electromagnetic foo fighter space travel weightless foo fighter, targeted mutation ancient alien choral castle burmuta triangle, star people astronaut mercury technology space time . targeted mutation mainstream archaelogy cover up pyramids flying vessels, crystal skull clearly ancient alien mainstream archaelogy, targeted mutation . i know it sounds crazy... Flying vessels astronaut targeted mutation ancient god space time, sumerian texts gods burmuta triangle grey nazca lines ancient religions, mahabharata star gates technology cover up choral castle. electromagnetic otherworldly visitors mercury space brothers mercury grey , king soloman dna manipulation elongated skull targeted mutation legendary times, machu picchu sumerian texts anti-gravity helicopter heiroglyph. ancient alien electromagnetic foo fighter space travel weightless foo fighter, targeted mutation ancient alien choral castle burmuta triangle, star people astronaut mercury technology space time . targeted mutation mainstream archaelogy cover up pyramids flying vessels, crystal skull clearly ancient alien mainstream archaelogy, targeted mutation . i know it sounds crazy... Flying vessels astronaut targeted mutation ancient god space time, sumerian texts gods burmuta triangle grey nazca lines ancient religions, mahabharata star gates technology cover up choral castle. electromagnetic otherworldly visitors mercury space brothers mercury grey , king soloman dna manipulation elongated skull targeted mutation legendary times, machu picchu sumerian texts anti-gravity helicopter heiroglyph. ancient alien electromagnetic foo fighter space travel weightless foo fighter, targeted mutation ancient alien choral castle burmuta triangle, star people astronaut mercury technology space time . targeted mutation mainstream archaelogy cover up pyramids flying vessels, crystal skull clearly ancient alien mainstream archaelogy, targeted mutation . i know it sounds crazy... Flying vessels astronaut targeted mutation ancient god space time, sumerian texts gods burmuta triangle grey nazca lines ancient religions, mahabharata star gates technology cover up choral castle. electromagnetic otherworldly visitors mercury space brothers mercury grey , king soloman dna manipulation elongated skull targeted mutation legendary times, machu picchu sumerian texts anti-gravity helicopter heiroglyph.\n"
		const done = buffer.publish( message )
		monitor.promise_completion( done );
		promises.push(done)
	}
	const buildEnd = Date.now()
	logger.info("Took ", buildEnd - buildStart, "ms to build the messages")
	logger.info("Done queuing, waiting for draining")
	const sendStart = Date.now()
	const stop_monitor = completions_per_n_seconds( 3, monitor, function( last, now, delta ) {
		console.log("Completed ", delta, " samples");
	} );
	const result = await Promise.all(promises)
	const sendStop = Date.now()
	logger.info("Done in ", sendStop - sendStart, "ms.")
	stop_monitor();
}

main( async ( logger ) => {
	await run_test( logger )
});
