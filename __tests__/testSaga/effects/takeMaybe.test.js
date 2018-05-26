// @flow
import { takeMaybe } from 'redux-saga/effects';
import testSaga from 'testSaga';

function* mainSaga() {
  yield takeMaybe('FOO');
}

test('handles takeMaybe', () => {
  testSaga(mainSaga)
    .next()
    .takeMaybe('FOO');
});

test('throws if pattern wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .takeMaybe('BAR');
  }).toThrow();
});
