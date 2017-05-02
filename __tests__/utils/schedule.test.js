const local = typeof window !== 'undefined'
  ? window
  : global;

delete local.setImmediate;

const { schedule } = require('utils/async');

test('runs a task and resolves with result', async () => {
  const result = await schedule(() => 42);

  expect(result).toBe(42);
});
