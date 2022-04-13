import {devices as playwrightDevices} from 'playwright';

export type Device = typeof playwrightDevices[keyof typeof playwrightDevices];

export type Devices = Record<string, Device | undefined>;

export const devices: Devices = {
	...playwrightDevices,
	default: undefined,
} as unknown as Devices;
