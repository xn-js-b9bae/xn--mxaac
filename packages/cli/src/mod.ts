import assert from 'assert';
import path from 'path';
import process from 'process';

import {globby} from 'globby';
import {isMatch} from 'matcher';
import PQueue from 'p-queue';

import {browsers} from './browsers';
import {setupWorker, type WorkerOptions} from './channel/dom';
import {devices} from './devices';
import {TestFileServer} from './files';
import {create as createReporter} from './reporter/tap';

import type Emittery from 'emittery';

const testFileFilter = (testFile: string) => {
	const basename = path.basename(testFile);
	return !basename.startsWith('_') && !basename.startsWith('.');
};

const crash = (error: Error) => {
	console.error('uncaught error', error);
};

export type Options = {
	pattern: string[] | undefined;
	browsers: readonly string[];
	devices: readonly string[];
	concurrency: number;
	match: readonly string[];
};

type Reporter = Emittery;
type Queue = PQueue;

export type Runtime = {
	fileServer: TestFileServer;
	reporter: Reporter;
	queue: Queue;
};

export const aba = async (
	options: Options,
	givenRuntime?: Partial<Runtime>,
): Promise<void> => {
	const runtime = {
		reporter: givenRuntime?.reporter ?? createReporter(process.stdout),
		queue:
			givenRuntime?.queue ?? new PQueue({concurrency: options.concurrency}),
		fileServer: givenRuntime?.fileServer ?? new TestFileServer(),
	};

	await runAllTestsIsolatedParallel(options, runtime);

	if (givenRuntime?.fileServer !== runtime.fileServer) {
		runtime.fileServer.close();
	}
};

export const runAllTestsIsolatedParallel = async (
	options: Options,
	runtime: Runtime,
): Promise<void> => {
	runtime.reporter.emit('start').catch(crash);
	runtime.queue.on('error', crash);
	const testFiles =
		options.pattern === undefined ? [] : await globby(options.pattern);
	const browser = await browsers[options.browsers[0]].launch();
	const device = devices[options.devices[0]];
	// eslint-disable-next-line unicorn/no-array-callback-reference
	for (const testFile of testFiles.filter(testFileFilter)) {
		runtime.queue
			.add(async () =>
				queueAllTestsOfTestFile(options, runtime, {browser, device}, testFile),
			)
			.catch(crash);
	}

	await runtime.queue.onIdle();

	runtime.reporter.emit('finish').catch(crash);
	await browser.close();
};

export const queueAllTestsOfTestFile = async (
	options: Options,
	runtime: Runtime,
	{device, browser}: WorkerOptions,
	path: string,
): Promise<void> => {
	const uri = await runtime.fileServer.getTestPathURI(path);

	const worker = await setupWorker({device, browser}, uri);

	for await (const event of worker.messages()) {
		assert(event.path === path);
		switch (event.type) {
			case 'test-declare': {
				if (
					options.match === undefined ||
					isMatch(event.title, options.match)
				) {
					runtime.queue
						.add(async () =>
							runOneTestIsolated(runtime, {device, browser}, path, event.title),
						)
						.catch(crash);
				}

				break;
			}

			case 'parsed': {
				return;
			}

			default: {
				break;
			}
		}
	}

	await worker.terminate();
};

export const runOneTestIsolated = async (
	runtime: Runtime,
	{device, browser}: WorkerOptions,
	path: string,
	title: string,
): Promise<void> => {
	const uri = await runtime.fileServer.getTestURI(path, title);

	const worker = await setupWorker({device, browser}, uri);

	// eslint-disable-next-line no-labels
	polling: for await (const event of worker.messages()) {
		runtime.reporter.emit('event', event).catch(crash);
		assert(event.path === path);
		switch (event.type) {
			case 'error': {
				// TODO proper cleanup
				// exit(1, `Error executing ${event.path}: ${JSON.stringify(event.error, undefined, 2)}`);
				// eslint-disable-next-line no-labels
				break polling;
			}

			case 'test-pass':
			case 'test-fail': {
				assert(event.title === title);
				// eslint-disable-next-line no-labels
				break polling;
			}

			default: {
				break;
			}
		}
	}

	await worker.terminate();
};
