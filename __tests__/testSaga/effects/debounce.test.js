// @flow
import { call, debounce } from 'redux-saga/effects';
import testSaga from 'testSaga';

const DEBOUNCE_TIME = 500;

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
  yield debounce(DEBOUNCE_TIME, backgroundSaga, 42);
}

test('handles debounce effect', () => {
  testSaga(mainSaga)
    .next()
    .debounce(DEBOUNCE_TIME, backgroundSaga, 42);
});

test('throws if wrong pattern', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .debounce(DEBOUNCE_TIME + 1, backgroundSaga, 42);
  }).toThrow();
});

test('throws if wrong saga', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .debounce(DEBOUNCE_TIME, otherBackgroundSaga, 42);
  }).toThrow();
});

test('throws if args are wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .debounce(DEBOUNCE_TIME, backgroundSaga, 43);
  }).toThrow();
});

test('throws if different effect', () => {
  expect(_ => {
    testSaga(otherSaga)
      .next()
      .debounce(DEBOUNCE_TIME, backgroundSaga, 42);
  }).toThrow();
});
