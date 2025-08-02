# :flying_saucer: ABA (:warning: WIP :building_construction:)

> Test runner for browser libraries.

**ABA** allows you to run tests for browser libraries isolated and in parallel.
This is made possible by `playwright`, `rollup`, and some magic glue.

The end goal is to replicate AVA's experience for browser libraries, with tests
happening in real browsers. The only alternatives I know of are `jest`'s `jsdom`
polyfilling, but that is not a real browser, or setting up everything by hand
which is better done once correctly.

[![License](https://img.shields.io/github/license/xn-js-b9bae/xn--mxaac.svg)](https://raw.githubusercontent.com/xn-js-b9bae/xn--mxaac/main/LICENSE)
[![Version](https://img.shields.io/npm/v/xn--mxaac.svg)](https://www.npmjs.org/package/xn--mxaac)
[![Tests](https://img.shields.io/github/actions/workflow/status/xn-js-b9bae/xn--mxaac/ci.yml?branch=main&event=push&label=tests)](https://github.com/xn-js-b9bae/xn--mxaac/actions/workflows/ci.yml?query=branch:main)
[![Dependencies](https://img.shields.io/librariesio/github/xn-js-b9bae/xn--mxaac.svg)](https://github.com/xn-js-b9bae/xn--mxaac/network/dependencies)
[![GitHub issues](https://img.shields.io/github/issues/xn-js-b9bae/xn--mxaac.svg)](https://github.com/xn-js-b9bae/xn--mxaac/issues)
[![Downloads](https://img.shields.io/npm/dm/xn--mxaac.svg)](https://www.npmjs.org/package/xn--mxaac)

[![Code issues](https://img.shields.io/codeclimate/issues/xn-js-b9bae/xn--mxaac.svg)](https://codeclimate.com/github/xn-js-b9bae/xn--mxaac/issues)
[![Code maintainability](https://img.shields.io/codeclimate/maintainability/xn-js-b9bae/xn--mxaac.svg)](https://codeclimate.com/github/xn-js-b9bae/xn--mxaac/trends/churn)
[![Code coverage (cov)](https://img.shields.io/codecov/c/gh/xn-js-b9bae/xn--mxaac/main.svg)](https://codecov.io/gh/xn-js-b9bae/xn--mxaac)
[![Code technical debt](https://img.shields.io/codeclimate/tech-debt/xn-js-b9bae/xn--mxaac.svg)](https://codeclimate.com/github/xn-js-b9bae/xn--mxaac/trends/technical_debt)
[![Documentation](https://xn-js-b9bae.github.io/xn--mxaac/coverage.svg)](https://xn-js-b9bae.github.io/xn--mxaac/modules.html)
[![Package size](https://img.shields.io/bundlephobia/minzip/xn--mxaac)](https://bundlephobia.com/result?p=xn--mxaac)


## :warning: Caveats

  - In its current state, ABA is best suited to test **non-graphical**
libraries, those that do not touch the DOM, but still rely on browser-only
features such as `localStorage`, and `indexeddb`.

  - Tests really run **isolated**. There is no way with the current
implementation to have test functions interact with each other in any way
(`localStorage`, `indexeddb`, and cache in general are not shared). This is
counter-intuitive coming from AVA, where disk writes do persist. Browser
contexts provide a real sandbox from which you cannot escape, and those are
discarded once the test function returns or throws. It may be interesting to
provide solutions to this new problem in the future (for instance to test the
behavior of a browser library when running in multiple tabs).


## :woman_teacher: Example

Install **ABA**

> yarn add --dev xn--mxaac

Declaring tests

> :warning: Currently support is only guaranteed for tests written in
> TypeScript and all tests are expected to be `async`.

```ts
// myTestFile.ts
import test from 'xn--mxaac';

test('title', async () => {
	// do something with the browser API
	// throw an Error to fail the test
});
```

Running tests

```shell
aba myTestFile.ts
```

> :bulb: Any number of glob expressions is supported, for instance
> `aba '*.ts'` (see [`globby`](https://github.com/sindresorhus/globby)).


## :sparkles: Features

  - [x] Basic browser/device selection
  - [x] Basic filter/match
  - [x] Basic timeout
  - [x] Basic fatal error catching
  - [x] TAP reporter


### :pencil: TODO

  - [ ] Use proper logger for debugging instead of `console.error`
  - [ ] Coverage (using c8/ts-node/babel?)
  - [ ] GitHub actions coverage
  - [ ] "nice" tasklist-like reporter
  - [ ] HTTP polling instead of DOM polling if available
  - [ ] Websocket instead of DOM polling if available (see https://playwright.dev/docs/network#websockets or better https://masteringjs.io/tutorials/node/websocket-server)
  - [ ] Multi browser/device matrix run
  - [ ] Config file
  - [ ] Watch mode (this should be easy through rollup's watch mechanism)
  - [ ] Inspect mode (HTTP server only) to manually open generated HTML files
  - [ ] Make parsing grow linearly with test file size (currently sends a test
    file containing N tests N times to a browser context, each browser context
    reads all the tests code).


## :woman_juggling: How does it work?

A use-once duplex communication channel is established through:

  1. Sending arbitrary data to the browser through pointing it to a URL with an
     arbitrary location hash.
  2. Sending arbitrary data back to the test runner through writing arbitrary
     content to the DOM.

```ts
import test from 'xn--mxaac';

import {assert} from 'chai';

for (const myTitle of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
	test(myTitle, async () => {
		// breaking through abstraction, you are not supposed to do this
		const startEvents = document.querySelector('#events')
			.filter(({type}) => type === 'test-start')

		const myStartEvents = startEvents
			.filter(({title}) => title === myTitle);

		assert(myStartEvents.length === 1);

		const otherStartEvents = startEvents
			.filter(({title}) => title !== myTitle);

		assert(otherStartEvents.length === 0);
	});
}
```

In the future we will implement a multi-use duplex communication channel
through websockets or HTTP long-polling.
