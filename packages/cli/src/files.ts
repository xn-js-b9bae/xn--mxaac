import assert from 'assert';

import process from 'process';
import {Server} from 'http';
import express from 'express';
import {Express} from 'express-serve-static-core';
import getPort, {portNumbers} from 'get-port';
import {encodeTestPath, encodeTestTitle} from '../../lib/src/uri';
import {bundle} from './bundle';

type Port = number | string;

export class TestFileServer {
	#port: Port | undefined;
	#app: Express | undefined;
	#server: Server | undefined;
	#bundleCache = new Map<string, Promise<string>>();

	close() {
		if (this.#server !== undefined) {
			console.error('Closing server.');
			const returnValue = this.#server.close();
			this.#app = undefined;
			this.#port = undefined;
			this.#server = undefined;
			return returnValue;
		}
	}

	async _bundle(path: string): Promise<string> {
		const cached = this.#bundleCache.get(path);
		if (cached) return cached;
		console.error(`cache miss for ${path}`);
		const p = bundle(path, 'esm');
		this.#bundleCache.set(path, p);
		return p;
	}

	async _ensureServer(): Promise<Port> {
		if (this.#app !== undefined) {
			assert(this.#server !== undefined);
			assert(this.#port !== undefined);
			return this.#port;
		}

		assert(this.#server === undefined);
		assert(this.#port === undefined);

		const _app = express();

		_app.get('/html/:test', (request, response, _next) => {
			console.error('get', request.url);
			response.end(
				`
	      <!DOCTYPE html>
	      <html>
	      <body>
	      <pre id="state"></pre>
	      <pre id="events"></pre>
	      <script src="/script/${encodeURIComponent(request.params.test)}"></script>
	      </body>
	      </html>
	    `.trim(),
			);
		});

		_app.get('/script/:test', async (request, response, _next) => {
			console.error('get', request.url, request.params.test);
			const test = request.params.test;
			const code = await this._bundle(test);
			response.end(code);
		});

		_app.get('*', async (request, _response, _next) => {
			console.error('get', request.url, 'unhandled');
		});

		const _port =
			process.env.PORT ??
			(await getPort({
				port: portNumbers(8877, 8887),
			}));

		this.#app = _app;
		this.#port = _port;

		return new Promise<Port>((resolve, _reject) => {
			this.#server = _app.listen(_port, () => {
				console.error(`Server listen on port ${_port}`);
				resolve(_port);
			});
		});
	}

	async getTestPathURI(path: string): Promise<string> {
		const port = await this._ensureServer();
		return `http://localhost:${port}/html/${encodeTestPath(path)}`;
	}

	async getTestURI(path: string, title: string): Promise<string> {
		const pathURI = await this.getTestPathURI(path);
		return `${pathURI}#${encodeTestTitle(title)}`;
	}
}
