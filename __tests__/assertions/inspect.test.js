// @flow
import testSaga from '../../src/testSaga';

function* saga() {
  yield 42;
}

test('receives yielded value', () => {
  const spy = jest.fn();

  testSaga(saga)
    .next()
    .inspect(spy);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(42);
});

test('does not error with correct assertions', () => {
  expect(() => {
    testSaga(saga)
      .next()
      .inspect((value) => {
        expect(value).toBe(42);
      });
  }).not.toThrow();
});

test('allows assertion errors to bubble up', () => {
  expect(() => {
    testSaga(saga)
      .next()
      .inspect((value) => {
        expect(value).toBe(43);
      });
  }).toThrow();
});

test('allows general errors to bubble up', () => {
  expect(() => {
    testSaga(saga)
      .next()
      .inspect(() => {
        throw new Error('whoops');
      });
  }).toThrowError('whoops');
});
