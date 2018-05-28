// @flow
import { putResolve } from 'redux-saga/effects';
import testSaga from 'testSaga';

function* mainSaga() {
  yield putResolve({ type: 'FOO' });
}

test('handles putResolve', () => {
  testSaga(mainSaga)
    .next()
    .putResolve({ type: 'FOO' });
});

test('throws if arg wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .putResolve({ type: 'BAR' });
  }).toThrow();
});
