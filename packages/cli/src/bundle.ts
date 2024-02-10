import assert from 'assert';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import {rollup, type ModuleFormat} from 'rollup';

const plugins = [
	typescript({module: 'esnext', lib: ['esnext', 'dom']}),
	nodeResolve(),
	json(),
	commonjs(),
];

export async function bundle(source: string, format: ModuleFormat) {
	let bundle;
	try {
		bundle = await rollup({input: [source], plugins});
		const {output} = await bundle.generate({format});
		assert(output.length === 1);
		return output[0].code;
	} catch (error: unknown) {
		console.error(error);
		throw error;
	} finally {
		if (bundle) {
			// Closes the bundle
			await bundle.close();
		}
	}
}
