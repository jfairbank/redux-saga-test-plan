// @flow
import { apply } from 'redux-saga/effects';
import testSaga from 'testSaga';
import identity from 'utils/identity';

const context = {
  identity,
  foo() {},
};

function* mainSaga() {
  yield apply(context, 'identity');
}

test('handles call with method string', () => {
  testSaga(mainSaga)
    .next()
    .apply(context, 'identity');
});

test('throws if fn wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .apply(context, 'foo');
  }).toThrow();
});
