// @flow
import { call, takeLatest } from 'redux-saga/effects';
import testSaga from 'testSaga';

function identity(value) {
  return value;
}

function* otherBackgroundSaga(value) {
  yield call(identity, value + 1);
}

function* backgroundSaga(value) {
  yield call(identity, value);
}

function* otherSaga() {
  yield call(identity, 42);
}

function* mainSaga() {
  yield takeLatest('FOO', backgroundSaga, 42);
}

test('handles takeLatest effect', () => {
  testSaga(mainSaga)
    .next()
    .takeLatestEffect('FOO', backgroundSaga, 42);
});

test('throws if wrong pattern', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .takeLatestEffect('BAR', backgroundSaga, 42);
  }).toThrow();
});

test('throws if wrong saga', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .takeLatestEffect('FOO', otherBackgroundSaga, 42);
  }).toThrow();
});

test('throws if args are wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .takeLatestEffect('FOO', backgroundSaga, 43);
  }).toThrow();
});

test('throws if different effect', () => {
  expect(_ => {
    testSaga(otherSaga)
      .next()
      .takeLatestEffect('FOO', backgroundSaga, 42);
  }).toThrow();
});
