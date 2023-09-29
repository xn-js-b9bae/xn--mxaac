import {readdirSync} from 'fs';
import test from 'ava';
import {aba} from '../../packages/cli/src/mod';
import {create as createReporter} from '../../packages/cli/src/reporter/tap';
import TTYStream from '../helper/TTYStream';

const fixtures = 'test/fixture/tap';

const macro = test.macro({
	title: (title: string | undefined, directory: string) => title ?? directory,
	async exec(t, directory: string) {
		const tty = new TTYStream({columns: 200});
		const reporter = createReporter(tty);

		await aba(
			{
				browsers: ['chromium'],
				devices: ['default'],
				pattern: [`${fixtures}/${directory}`],
				match: ['*'],
				concurrency: 1,
			},
			{
				reporter,
			},
		);

		tty.end();
		const actual = tty.asBuffer().toString('utf8');

		t.snapshot(actual);
	},
});

for (const item of readdirSync(fixtures)) {
	test(macro, item);
}
