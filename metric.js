
class Metric {
	constructor() {
		this.successes = 0;
		this.failures = 0;
		this.completed = 0;
	}

	success() {
		this.completed++;
		this.successes++;
	}

	failure() {
		this.completed++;
		this.failures++;
	}

	promise_completion( promise ){
		promise.then( () => { this.success() }, () => { this.failure() })
	}
}

function completions_per_second( metric, digest ) {
	return completions_per_n_second( 1, metric, digest );
}

function completions_per_n_seconds( count, metric, digest ) {
	return delta_per_sample( 1000 * count, () => metric.completed, digest );
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
	completions_per_n_seconds,
	delta_per_sample,
	completions_per_second
}
