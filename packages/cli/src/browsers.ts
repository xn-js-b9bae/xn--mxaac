import {chromium, firefox, webkit, BrowserType} from 'playwright';

export const browsers: Record<string, BrowserType> = {
	chromium,
	firefox,
	webkit,
};
