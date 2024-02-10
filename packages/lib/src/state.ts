import Emittery from 'emittery';

import type {RunEvent, ErrorDescription, TestHistory} from './events';

export type State = {
	parsed: boolean;
	declared: number;
	queued: number;
	pass: number;
	fail: number;
	error: ErrorDescription | undefined;
	history: Record<string, TestHistory>;
};

const initHistory = () => {
	return {
		queued: false,
		done: false,
		pass: false,
		fail: false,
		running: false,
		errors: [],
	};
};

const init = (): State => {
	return {
		parsed: false,
		declared: 0,
		queued: 0,
		pass: 0,
		fail: 0,
		error: undefined,
		history: {},
	};
};

export const create = (): Emittery => {
	const emitter = new Emittery();

	let state = init();

	emitter.on('init', () => {
		state = init();
	});

	emitter.on('event', (event: RunEvent) => {
		// eslint-disable-next-line default-case
		switch (event.type) {
			case 'error': {
				state.error = event.error;
				break;
			}

			case 'test-declare': {
				++state.declared;
				state.history[event.title] = initHistory();
				break;
			}

			case 'test-queue': {
				state.history[event.title].queued = true;
				++state.queued;
				break;
			}

			case 'test-start': {
				state.history[event.title].queued = false;
				state.history[event.title].running = true;
				break;
			}

			case 'test-pass': {
				state.history[event.title].running = false;
				state.history[event.title].pass = true;
				state.history[event.title].done = true;
				++state.pass;
				break;
			}

			case 'test-fail': {
				state.history[event.title].running = false;
				state.history[event.title].fail = true;
				state.history[event.title].done = true;
				state.history[event.title].errors.push(event.error);
				++state.fail;
				break;
			}

			case 'parsed': {
				state.parsed = true;
				break;
			}
		}
	});

	emitter.on('dump', (callback: (state: State) => void) => {
		callback(state);
	});

	return emitter;
};
