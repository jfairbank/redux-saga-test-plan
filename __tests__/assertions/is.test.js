// @flow
import testSaga from 'testSaga';

test('handles primitive values', () => {
  function* mainSaga() {
    yield 42;
  }

  testSaga(mainSaga).next().is(42);

  expect(_ => {
    testSaga(mainSaga).next().is('foo');
  }).toThrowError('yielded values do not match');
});

test('handles objects', () => {
  function* mainSaga() {
    yield { hello: 'world', foo: { bar: 'baz' } };
  }

  testSaga(mainSaga)
    .next()
    .is({ hello: 'world', foo: { bar: 'baz' } });

  expect(_ => {
    testSaga(mainSaga)
      .next()
      .is({ hello: 'mundo', foo: { bar: 'baz' } });
  }).toThrowError('yielded values do not match');

  expect(_ => {
    testSaga(mainSaga)
      .next()
      .is({ hello: 'world', foo: { bar: 'quux' } });
  }).toThrowError('yielded values do not match');
});
