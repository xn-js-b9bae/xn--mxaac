import {randomBytes} from 'crypto';

export const generateSecret = async () => {
	return new Promise<string>((resolve, reject) => {
		randomBytes(20, (error, buf) => {
			if (error) reject(error);
			else resolve(buf.toString('base64'));
		});
	});
};
