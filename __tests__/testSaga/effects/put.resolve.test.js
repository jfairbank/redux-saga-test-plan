// @flow
import { put } from 'redux-saga/effects';
import { testSaga } from '../../../src';

function* mainSaga() {
  yield put.resolve({ type: 'FOO' });
}

test('handles put.resolve', () => {
  testSaga(mainSaga)
    .next()
    .put.resolve({ type: 'FOO' });
});

test('throws if arg wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .put.resolve({ type: 'BAR' });
  }).toThrow();
});
