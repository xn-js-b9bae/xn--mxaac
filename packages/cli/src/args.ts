// Adapted from https://github.com/avajs/ava/blob/9d3559338aab8c3de800404b2652747399fc1709/lib/cli.js
// License: https://github.com/avajs/ava/blob/9d3559338aab8c3de800404b2652747399fc1709/license
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

import os from 'os';
import {isCI} from 'ci-info';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {version} from '../../../package.json';
import {browsers} from './browsers';
import {devices} from './devices';

const keepLastValue = <T>(value: T | T[]): T | undefined =>
	Array.isArray(value) ? value.pop() : value;

const options = {
	concurrency: {
		alias: 'c',
		coerce: keepLastValue<number>,
		description:
			'Max number of test files running at the same time (default: CPU cores)',
		type: 'number',
	},
	browser: {
		alias: 'b',
		type: 'array',
		choices: Object.keys(browsers),
		default: ['chromium'],
	},
	device: {
		alias: 'd',
		type: 'array',
		choices: Object.keys(devices),
		default: ['default'],
	},
	'fail-fast': {
		coerce: keepLastValue,
		description: 'Stop after first test failure',
		type: 'boolean',
	},
	match: {
		alias: 'm',
		description: 'Only run tests with matching title (can be repeated)',
		type: 'array',
		default: ['*'],
	},
	serial: {
		alias: 's',
		coerce: keepLastValue,
		description: 'Run tests serially',
		type: 'boolean',
	},
	tap: {
		alias: 't',
		coerce: keepLastValue,
		description: 'Generate TAP output',
		type: 'boolean',
	},
	timeout: {
		alias: 'T',
		coerce: keepLastValue,
		description:
			'Set global timeout (milliseconds or human-readable, e.g. 10s, 2m)',
		type: 'string',
		default: '10s',
	},
	watch: {
		alias: 'w',
		coerce: keepLastValue,
		description: 'Re-run tests when files change',
		type: 'boolean',
	},
	reset: {
		alias: 'r',
		coerce: keepLastValue,
		description: 'Reset the cache before running the tests',
		type: 'boolean',
	},
	color: {
		description: 'Force color output',
		type: 'boolean',
	},
} as const;

export const parse = async (input: string[]) => {
	let pattern: string[] | undefined;
	const {argv} = yargs(hideBin(input))
		.version(version)
		.parserConfiguration({
			'boolean-negation': true,
			'camel-case-expansion': false,
			'combine-arrays': false,
			'dot-notation': false,
			'duplicate-arguments-array': true,
			'flatten-duplicate-arrays': true,
			'negation-prefix': 'no-',
			'parse-numbers': true,
			'populate--': true,
			'set-placeholder-key': false,
			'short-option-groups': true,
			'strip-aliased': true,
			'unknown-options-as-args': false,
		})
		.usage('$0 [<pattern>...]')
		.options(options)
		.command(
			'* [<pattern>...]',
			'Run tests',
			(yargs) =>
				yargs.positional('pattern', {
					array: true,
					describe:
						'Select which test files to run. Accepts glob patterns, directories that (recursively) contain test files, and file paths',
					type: 'string',
				}),
			(argv) => {
				pattern = argv.pattern;
			},
		)
		.example([['$0'], ['$0 test/']])
		.help();

	// Resolve the correct concurrency value.
	// From https://github.com/avajs/ava/blob/9d3559338aab8c3de800404b2652747399fc1709/lib/api.js#L249-L257
	const parsed = await argv;
	const {serial, ...rest} = parsed;
	const concurrency = serial
		? 1
		: rest.concurrency !== undefined && rest.concurrency > 0
		? rest.concurrency
		: Math.min(os.cpus().length, isCI ? 2 : Number.POSITIVE_INFINITY);

	return {...rest, concurrency, pattern};
};
