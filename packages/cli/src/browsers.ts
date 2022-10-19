import type {BrowserType} from 'playwright';
import {chromium, firefox, webkit} from 'playwright';

export const browsers: Record<string, BrowserType> = {
	chromium,
	firefox,
	webkit,
};
