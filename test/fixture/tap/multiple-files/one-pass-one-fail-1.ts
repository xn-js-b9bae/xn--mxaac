import test from '../../../../packages/api/dist/mod';

// eslint-disable-next-line @typescript-eslint/no-empty-function
test('pass', async () => {});

test('fail', async () => {
	throw new Error('haha');
});
