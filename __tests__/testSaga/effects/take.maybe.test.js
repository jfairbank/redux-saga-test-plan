// @flow
import { take } from 'redux-saga/effects';
import { testSaga } from '../../../src';

function* mainSaga() {
  yield take.maybe('FOO');
}

test('handles take.maybe', () => {
  testSaga(mainSaga)
    .next()
    .take.maybe('FOO');
});

test('throws if pattern wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .take.maybe('BAR');
  }).toThrow();
});
