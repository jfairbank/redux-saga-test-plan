// @flow
import { call } from 'redux-saga/effects';
import { testSaga } from '../../../src';
import identity from '../../../src/utils/identity';

const context = {
  identity,
  foo() {},
};

function* mainSaga() {
  yield call([context, 'identity']);
}

test('handles call with method string', () => {
  testSaga(mainSaga)
    .next()
    .call([context, 'identity']);
});

test('throws if fn wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call([context, 'foo']);
  }).toThrow();
});
