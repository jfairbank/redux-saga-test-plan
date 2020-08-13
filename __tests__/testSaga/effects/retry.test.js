// @flow
import { call, retry } from 'redux-saga/effects';
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
  yield retry(3, 500, backgroundSaga, 42);
}

test('handles retry effect', () => {
  testSaga(mainSaga)
    .next()
    .retry(3, 500, backgroundSaga, 42);
});

test('throws if wrong `maxTries`', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .retry(4, 500, backgroundSaga, 42);
  }).toThrow();
});

test('throws if wrong `delayLength`', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .retry(3, 250, backgroundSaga, 42);
  }).toThrow();
});

test('throws if wrong `fn`', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .retry(3, 500, otherBackgroundSaga, 42);
  }).toThrow();
});

test('throws if args are wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .retry(3, 500, backgroundSaga, 43);
  }).toThrow();
});

test('throws if different effect', () => {
  expect(_ => {
    testSaga(otherSaga)
      .next()
      .retry(3, 500, backgroundSaga, 42);
  }).toThrow();
});
