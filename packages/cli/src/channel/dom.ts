import type {Browser, Page} from 'playwright';
import type {RunEventWithDateTime} from '../../../lib/src/events';
import type {Device} from '../devices';

const sleep = async (ms: number) =>
	new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, ms);
	});

export const pollEvents = async function* (
	page: Page,
	firstNonReadIndex = 0,
): AsyncIterableIterator<RunEventWithDateTime> {
	const locator = page.locator('#events');
	for (;;) {
		// eslint-disable-next-line no-await-in-loop
		const [rawEvents] = await locator.allInnerTexts();
		try {
			const events = JSON.parse(rawEvents) as RunEventWithDateTime[];
			for (let i = firstNonReadIndex; i < events.length; ++i) {
				const event = events[i];
				yield event;
			}

			firstNonReadIndex = events.length;
		} catch (error: unknown) {
			console.error({events: rawEvents, error});
		}

		// eslint-disable-next-line no-await-in-loop
		await sleep(1000);
	}
};

export type WorkerOptions = {
	device?: Device;
	browser: Browser;
};

export const setupWorker = async (
	{device, browser}: WorkerOptions,
	uri: string,
) => {
	const context = await browser.newContext({
		...device,
	});

	const page = await context.newPage();

	await page.goto(uri);

	return {
		messages: () => pollEvents(page),
		terminate: async () => context.close(),
	};
};
