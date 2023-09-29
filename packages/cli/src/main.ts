#!/usr/bin/env node

import process from 'process';
import ms from 'ms';
import chalk from 'chalk';
import figures from 'figures';
import {parse} from './args';
import {aba} from './mod';

const {
	browser: browsers,
	device: devices,
	timeout,
	pattern,
	match,
	concurrency,
} = await parse(process.argv);

const timeoutMs = ms(timeout as string);

const to = setTimeout(() => {
	exit(1, `Timeout (${timeout as string})`);
}, timeoutMs);

const exit = (rc: number, message?: string) => {
	clearTimeout(to);
	if (rc !== 0) {
		console.error(
			`\n  ${chalk.red(figures.cross)} ${message ?? 'unknown error'}`,
		);
	}

	process.exit(rc);
};

try {
	await aba({
		pattern,
		match: match.map((x) => x.toString()),
		browsers,
		devices,
		concurrency,
	});
} catch (error) {
	console.error(error);
	if (error instanceof Error) {
		exit(1, error.message);
	} else {
		exit(1, 'unknown error');
	}
}

exit(0);
