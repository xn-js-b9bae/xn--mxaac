import assert from 'assert';
import type {ModuleFormat} from 'rollup';
import {rollup} from 'rollup';
import typescript from '@rollup/plugin-typescript';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';

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
