// @flow
import { call, throttle } from 'redux-saga/effects';
import { testSaga } from '../../../src';

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
  yield throttle(500, 'FOO', backgroundSaga, 42);
}

test('handles throttle effect', () => {
  testSaga(mainSaga)
    .next()
    .throttleEffect(500, 'FOO', backgroundSaga, 42);
});

test('throws if wrong delay', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .throttleEffect(250, 'FOO', backgroundSaga, 42);
  }).toThrow();
});

test('throws if wrong pattern', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .throttleEffect(500, 'BAR', backgroundSaga, 42);
  }).toThrow();
});

test('throws if wrong saga', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .throttleEffect(500, 'FOO', otherBackgroundSaga, 42);
  }).toThrow();
});

test('throws if args are wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .throttleEffect(500, 'FOO', backgroundSaga, 43);
  }).toThrow();
});

test('throws if different effect', () => {
  expect(_ => {
    testSaga(otherSaga)
      .next()
      .throttleEffect(500, 'FOO', backgroundSaga, 42);
  }).toThrow();
});
