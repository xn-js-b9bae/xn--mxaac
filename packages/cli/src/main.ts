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

aba({
	pattern,
	match,
	browsers,
	devices,
	concurrency,
})
	.then(() => {
		exit(0);
	})
	.catch((error) => {
		console.error(error);
		exit(1, error.message);
	});
