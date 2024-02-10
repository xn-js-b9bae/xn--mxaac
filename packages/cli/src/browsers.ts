import {chromium, firefox, webkit, type BrowserType} from 'playwright';

export const browsers: Record<string, BrowserType> = {
	chromium,
	firefox,
	webkit,
};
