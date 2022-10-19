type TestFileIdentifier = {
	path: string;
};

type TestIdentifier = {
	title: string;
} & TestFileIdentifier;

type TestDeclareEvent = {
	type: 'test-declare';
} & TestIdentifier;

type TestQueueEvent = {
	type: 'test-queue';
} & TestIdentifier;

type TestStartEvent = {
	type: 'test-start';
} & TestIdentifier;

export type ErrorDescription = {
	message: string;
	stack: string | undefined;
};

type TestFailEvent = {
	type: 'test-fail';
	error: ErrorDescription;
} & TestIdentifier;

type TestPassEvent = {
	type: 'test-pass';
} & TestIdentifier;

type TestEvent =
	| TestDeclareEvent
	| TestQueueEvent
	| TestStartEvent
	| TestFailEvent
	| TestPassEvent;

type FatalErrorEvent = {
	type: 'error';
	error: ErrorDescription;
} & TestFileIdentifier;

type ParsedEvent = {
	type: 'parsed';
} & TestFileIdentifier;

export type RunEvent = TestEvent | FatalErrorEvent | ParsedEvent;

export type RunEventWithDateTime = RunEvent & {datetime: Date};

export type TestHistory = {
	queued: boolean;
	running: boolean;
	done: boolean;
	pass: boolean;
	fail: boolean;
	errors: ErrorDescription[];
};
