import os from 'os';
import type {Writable} from 'stream';
import Emittery from 'emittery';
import * as supertap from 'supertap';
import type {ErrorDescription, RunEvent} from '../../../lib/src/events';
import type {State} from '../../../lib/src/state';
import {create as createState} from '../../../lib/src/state';

const dumpError = (error: ErrorDescription) => {
	return {...error};
};

const title = (event: RunEvent) => {
	// eslint-disable-next-line default-case
	switch (event.type) {
		case 'test-pass':
		case 'test-fail':
		case 'test-declare':
		case 'test-queue':
		case 'test-start':
			return `${event.path} - ${event.title}`;
		case 'error':
		case 'parsed':
			return `${event.path}`;
	}
};

export const create = (reportStream: Writable): Emittery => {
	const emitter = new Emittery();

	const state = createState();

	let i = 0;

	emitter.on('event', (event: RunEvent) => {
		void state.emit('event', event);

		let write = false;
		let passed = false;
		const skip = false;
		const todo = false;
		let error;

		// eslint-disable-next-line default-case
		switch (event.type) {
			case 'test-pass':
				write = true;
				passed = true;
				break;
			case 'test-fail':
				write = true;
				break;
			case 'test-declare':
				break;
			case 'test-queue':
				break;
			case 'test-start':
				break;
			case 'error':
				write = true;
				error = event.error;
				break;
			case 'parsed':
				break;
		}

		if (write) {
			reportStream.write(
				supertap.test(title(event), {
					comment: [],
					error: error === undefined ? undefined : dumpError(error),
					index: ++i,
					passed,
					skip,
					todo,
				}) + os.EOL,
			);
		}
	});

	emitter.on('start', () => {
		reportStream.write(supertap.start() + os.EOL);
	});

	emitter.on('finish', async () => {
		return state.emit('dump', (s: State) => {
			// TODO figure out correct count
			reportStream.write(
				supertap.finish({
					crashed: s.error ? 1 : 0,
					failed: s.fail,
					passed: s.pass,
					skipped: 0,
					todo: 0,
				}) + os.EOL,
			);
		});
	});

	return emitter;
};
