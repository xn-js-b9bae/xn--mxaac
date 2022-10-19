import type {RunEvent} from '../../lib/src/events';
import {create} from './channel/dom'; // TODO allow any implementation given by s

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

const run = async (title: string) => {
	console.error(`Running test ${title}`);
	const testFn = _tests.get(title);
	if (testFn === undefined) {
		throw new Error(`could not find title ${title}`);
	} else {
		await emit({type: 'test-queue', path, title});
		await flush();
		await testFn().then(
			async () => {
				await emit({type: 'test-pass', path, title});
				return flush();
			},
			async (error: Error) => {
				const {message, stack} = error;
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
		run(title).catch(async (error: Error) => {
			const {message, stack} = error;
			await emit({type: 'error', path, error: {message, stack}});
			await flush();
			console.error(error);
		});
	}
};

let to: any;

const setupAutorun = () => {
	to = setTimeout(autorun, 0);
};

const cancelAutorun = () => {
	clearTimeout(to);
};

setupAutorun();

const test = (title: string, testFn: Test) => {
	if (_tests.has(title)) {
		cancelAutorun();
		const error = new Error(`duplicate title ${title}`);
		const {message, stack} = error;
		emit({type: 'error', path, error: {message, stack}})
			.then(flush)
			.catch((error: Error) => {
				console.error('uncaught error', error);
			});
		return;
	}

	_tests.set(title, testFn);
};

export default test;
