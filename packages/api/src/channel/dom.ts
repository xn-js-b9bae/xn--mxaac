import Emittery from 'emittery';
import {RunEvent, RunEventWithDateTime} from '../../../lib/src/events';
import {State, create as createState} from '../../../lib/src/state';

export const create = (): Emittery => {
	const emitter = new Emittery();

	const state = createState();
	let events: RunEventWithDateTime[] = [];

	const render = async () => {
		return state.emit('dump', (state: State) => {
			const done = state.pass + state.fail;
			const _state = document.querySelector('#state');
			if (_state === null) {
				throw new Error('could not find #state element');
			}

			_state.textContent = JSON.stringify(
				{
					declared: state.declared,
					queued: state.queued,
					done,
					pass: state.pass,
					fail: state.fail,
					error: state.error,
					history: state.history,
				},
				undefined,
				2,
			);
			const _events = document.querySelector('#events');
			if (_events === null) {
				throw new Error('could not find #events element');
			}

			_events.textContent = JSON.stringify(events, undefined, 2);
		});
	};

	emitter.on('init', async () => {
		events = [];
		return state.emit('init');
	});

	emitter.on('flush', render);

	emitter.on('event', async (event: RunEvent) => {
		events.push({...event, datetime: new Date()});
		return state.emit('event', event);
	});

	return emitter;
};
