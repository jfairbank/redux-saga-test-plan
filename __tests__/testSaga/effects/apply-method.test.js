// @flow
import { apply } from 'redux-saga/effects';
import { testSaga } from '../../../src';
import identity from '../../../src/utils/identity';

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
