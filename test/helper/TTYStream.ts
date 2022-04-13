// Adapted from https://github.com/avajs/ava/blob/ae0042c95d2dbe72b4910931232ea15f6071e04e/test-tap/helper/tty-stream.js
// License: https://github.com/avajs/ava/blob/ae0042c95d2dbe72b4910931232ea15f6071e04e/license
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

import {Buffer} from 'buffer';
import stream from 'stream';

import ansiEscapes from 'ansi-escapes';

type Sanitizer = (chunk: string) => string;

export default class TTYStream extends stream.Writable {
	static SEPARATOR = Buffer.from('---tty-stream-chunk-separator\n', 'utf8');

	readonly isTTY = true as const;
	columns: number;
	chunks: Buffer[] = [];
	spinnerActivity: Buffer[] = [];
	sanitizers: Sanitizer[] = [];

	constructor(options: {columns: number; sanitizers?: Sanitizer[]}) {
		super();
		this.columns = options.columns;
		this.sanitizers = options.sanitizers ?? [];
	}

	_write(chunk: Buffer, _encoding: string, callback: () => void) {
		if (this.spinnerActivity.length > 0) {
			this.chunks.push(
				Buffer.concat(this.spinnerActivity),
				TTYStream.SEPARATOR,
			);
			this.spinnerActivity = [];
		}

		// eslint-disable-next-line unicorn/no-array-reduce
		const string = this.sanitizers.reduce(
			(string_, sanitizer) => sanitizer(string_),
			chunk.toString('utf8'),
		);
		// Ignore the chunk if it was scrubbed completely. Still count 0-length
		// chunks.
		if (string !== '' || chunk.length === 0) {
			this.chunks.push(Buffer.from(string, 'utf8'), TTYStream.SEPARATOR);
		}

		callback();
	}

	_writev(chunks: Array<{chunk: Buffer}>, callback: () => void) {
		if (this.spinnerActivity.length > 0) {
			this.chunks.push(
				Buffer.concat(this.spinnerActivity),
				TTYStream.SEPARATOR,
			);
			this.spinnerActivity = [];
		}

		for (const {chunk} of chunks) {
			this.chunks.push(
				Buffer.from(
					// eslint-disable-next-line unicorn/no-array-reduce
					this.sanitizers.reduce(
						(string, sanitizer) => sanitizer(string),
						chunk.toString('utf8'),
					),
					'utf8',
				),
			);
		}

		this.chunks.push(TTYStream.SEPARATOR);
		callback();
	}

	asBuffer() {
		return Buffer.concat(this.chunks);
	}

	clearLine() {
		this.spinnerActivity.push(Buffer.from(ansiEscapes.eraseLine, 'ascii'));
	}

	cursorTo(x: number, y: number) {
		this.spinnerActivity.push(Buffer.from(ansiEscapes.cursorTo(x, y), 'ascii'));
	}

	moveCursor(dx: number, dy: number) {
		this.spinnerActivity.push(
			Buffer.from(ansiEscapes.cursorMove(dx, dy), 'ascii'),
		);
	}
}
