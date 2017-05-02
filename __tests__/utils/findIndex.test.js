delete Array.prototype.findIndex;

const { findIndex } = require('utils/array');

const array = ['foo', 'bar', 'baz'];

test('returns the index if found', () => {
  const index = findIndex(array, s => s === 'bar');

  expect(index).toBe(1);
});

test('returns -1 if not found', () => {
  const index = findIndex(array, s => s === 'quux');

  expect(index).toBe(-1);
});
