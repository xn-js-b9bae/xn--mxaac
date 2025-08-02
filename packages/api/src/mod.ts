import {create} from './channel/dom'; // TODO allow any implementation given by s

import type {RunEvent} from '../../lib/src/events';

const path = decodeURIComponent(
	document.location.pathname.split('/').pop() ?? '',
);
// TODO receive this to long-polling or websocket and drop one-way DOM channel
// implementation
const title = decodeURIComponent(document.location.hash.slice(1));

export type Test = () => Promise<void>;

const _tests = new Map<string, Test>();

const channel = create();

const init = async () => {
	return channel.emit('init');
};

const emit = async (event: RunEvent) => {
	return channel.emit('event', event);
};

const flush = async () => {
	return channel.emit('flush');
};

const _error = (error: unknown) => {
	if (error instanceof Error) return error;

	return {
		message: 'unknown error',
		stack: 'unknown error',
	};
};

const run = async (title: string) => {
	console.error(`Running test ${title}`);
	const testFunction = _tests.get(title);
	if (testFunction === undefined) {
		throw new Error(`could not find title ${title}`);
	} else {
		await emit({type: 'test-queue', path, title});
		await flush();
		await testFunction().then(
			async () => {
				await emit({type: 'test-pass', path, title});
				return flush();
			},
			async (error: unknown) => {
				const {message, stack} = _error(error);
				console.error(`Test ${title} failed with error`, {error});
				await emit({type: 'test-fail', path, title, error: {message, stack}});
				return flush();
			},
		);
	}
};

const autorun = async () => {
	await init();
	await flush();
	for (const title of _tests.keys()) {
		// TODO declare tests as we read them
		// eslint-disable-next-line no-await-in-loop
		await emit({type: 'test-declare', path, title});
	}

	await emit({type: 'parsed', path});
	await flush();
	if (title !== '') {
		run(title).catch(async (error: unknown) => {
			const {message, stack} = _error(error);
			await emit({type: 'error', path, error: {message, stack}});
			await flush();
			console.error(error);
		});
	}
};

let to: ReturnType<typeof setTimeout> | undefined;

const setupAutorun = () => {
	to = setTimeout(autorun, 0);
};

const cancelAutorun = () => {
	clearTimeout(to);
};

setupAutorun();

const test = (title: string, testFunction: Test) => {
	if (_tests.has(title)) {
		cancelAutorun();
		const error = new Error(`duplicate title ${title}`);
		const {message, stack} = error;
		emit({type: 'error', path, error: {message, stack}})
			.then(flush)
			.catch((error: unknown) => {
				console.error('uncaught error', error);
			});
		return;
	}

	_tests.set(title, testFunction);
};

export default test;
