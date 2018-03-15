
class Metric {
	constructor() {
		this.successes = 0;
		this.failures = 0;
		this.completed = 0;
	}

	promise_completion( promise ){
		promise.then( () => {
			this.completed++;
			this.successes++;
		}, () => {
			this.completed++;
			this.failures++;
		})
	}
}

function completions_per_second( metric, digest ) {
	return delta_per_sample( 1000, () => metric.completed, digest );
}

function delta_per_sample( sample_length, sample, digest_sample ) {
	let last = sample();
	let cancel_token = setInterval( () =>{
		const now = sample();
		digest_sample( last, now,  now - last)
		last = now;
	}, sample_length);
	return function(){
		clearInterval(cancel_token);
	}
}

module.exports = {
	Metric,
	delta_per_sample,
	completions_per_second
}
