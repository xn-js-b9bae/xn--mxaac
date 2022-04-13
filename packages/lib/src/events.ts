interface TestFileIdentifier {
	path: string;
}

interface TestIdentifier extends TestFileIdentifier {
	title: string;
}

interface TestDeclareEvent extends TestIdentifier {
	type: 'test-declare';
}

interface TestQueueEvent extends TestIdentifier {
	type: 'test-queue';
}

interface TestStartEvent extends TestIdentifier {
	type: 'test-start';
}

export interface ErrorDescription {
	message: string;
	stack: string | undefined;
}

interface TestFailEvent extends TestIdentifier {
	type: 'test-fail';
	error: ErrorDescription;
}

interface TestPassEvent extends TestIdentifier {
	type: 'test-pass';
}

type TestEvent =
	| TestDeclareEvent
	| TestQueueEvent
	| TestStartEvent
	| TestFailEvent
	| TestPassEvent;

interface FatalErrorEvent extends TestFileIdentifier {
	type: 'error';
	error: ErrorDescription;
}

interface ParsedEvent extends TestFileIdentifier {
	type: 'parsed';
}

export type RunEvent = TestEvent | FatalErrorEvent | ParsedEvent;

export type RunEventWithDateTime = RunEvent & {datetime: Date};

export interface TestHistory {
	queued: boolean;
	running: boolean;
	done: boolean;
	pass: boolean;
	fail: boolean;
	errors: ErrorDescription[];
}
