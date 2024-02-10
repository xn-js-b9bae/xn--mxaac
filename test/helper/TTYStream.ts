// Adapted from https://github.com/avajs/ava/blob/ae0042c95d2dbe72b4910931232ea15f6071e04e/test-tap/helper/tty-stream.js
// License: https://github.com/avajs/ava/blob/ae0042c95d2dbe72b4910931232ea15f6071e04e/license
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

import stream from 'stream';

import ansiEscapes from 'ansi-escapes';
import {concatUint8Arrays} from 'uint8array-extras';

type Sanitizer = (chunk: string) => string;

export default class TTYStream extends stream.Writable {
	static SEPARATOR: Uint8Array = new TextEncoder().encode(
		'---tty-stream-chunk-separator\n',
	);

	readonly isTTY = true as const;
	columns: number;
	chunks: Uint8Array[] = [];
	spinnerActivity: Uint8Array[] = [];
	sanitizers: Sanitizer[] = [];

	readonly #encoder: TextEncoder = new TextEncoder();
	readonly #decoder: TextDecoder = new TextDecoder('utf8');

	constructor(options: {columns: number; sanitizers?: Sanitizer[]}) {
		super();
		this.columns = options.columns;
		this.sanitizers = options.sanitizers ?? [];
	}

	_write(chunk: Uint8Array, _encoding: string, callback: () => void) {
		if (this.spinnerActivity.length > 0) {
			this.chunks.push(
				concatUint8Arrays(this.spinnerActivity),
				TTYStream.SEPARATOR,
			);
			this.spinnerActivity = [];
		}

		// eslint-disable-next-line unicorn/no-array-reduce
		const string = this.sanitizers.reduce(
			(string_, sanitizer) => sanitizer(string_),
			this.#decoder.decode(chunk),
		);
		// Ignore the chunk if it was scrubbed completely. Still count 0-length
		// chunks.
		if (string !== '' || chunk.length === 0) {
			this.chunks.push(this.#encoder.encode(string), TTYStream.SEPARATOR);
		}

		callback();
	}

	_writev(chunks: Array<{chunk: Uint8Array}>, callback: () => void) {
		if (this.spinnerActivity.length > 0) {
			this.chunks.push(
				concatUint8Arrays(this.spinnerActivity),
				TTYStream.SEPARATOR,
			);
			this.spinnerActivity = [];
		}

		for (const {chunk} of chunks) {
			this.chunks.push(
				this.#encoder.encode(
					// eslint-disable-next-line unicorn/no-array-reduce
					this.sanitizers.reduce(
						(string, sanitizer) => sanitizer(string),
						this.#decoder.decode(chunk),
					),
				),
			);
		}

		this.chunks.push(TTYStream.SEPARATOR);
		callback();
	}

	asUint8Array() {
		return concatUint8Arrays(this.chunks);
	}

	toString() {
		const array = this.asUint8Array();
		return this.#decoder.decode(array);
	}

	clearLine() {
		this.spinnerActivity.push(this.#encoder.encode(ansiEscapes.eraseLine));
	}

	cursorTo(x: number, y: number) {
		this.spinnerActivity.push(this.#encoder.encode(ansiEscapes.cursorTo(x, y)));
	}

	moveCursor(dx: number, dy: number) {
		this.spinnerActivity.push(
			this.#encoder.encode(ansiEscapes.cursorMove(dx, dy)),
		);
	}
}
