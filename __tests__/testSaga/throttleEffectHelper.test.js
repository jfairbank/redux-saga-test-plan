// @flow
import { takeEvery, throttle } from 'redux-saga';
import { call } from 'redux-saga/effects';
import testSaga from 'testSaga';

function identity(value) {
  return value;
}

function* backgroundSaga(action, value) {
  yield call(identity, value);
}

function* otherBackgroundSaga(action) {
  yield call(identity, action.payload);
}

function* mainSaga() {
  yield call(identity, 'foo');
  yield* throttle(500, 'READY', backgroundSaga, 42);
}

function* mainSagaYieldingThrottle() {
  yield call(identity, 'foo');
  yield throttle(500, 'READY', backgroundSaga, 42);
}

function* mainSagaYieldingTakeEvery() {
  yield call(identity, 'foo');
  yield takeEvery('READY', backgroundSaga, 42);
}

test('handles delegating throttle', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .throttle(500, 'READY', backgroundSaga, 42)
      .finish()
      .isDone();
  }).not.toThrow();
});

test('delegating throws if wrong delay time', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .throttle(250, 'READY', backgroundSaga, 42)
      .finish()
      .isDone();
  }).toThrow();
});

test('delegating throws if wrong pattern', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .throttle(500, 'DONE', backgroundSaga, 42)
      .finish()
      .isDone();
  }).toThrow();
});

test('delegating throws if wrong saga', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .throttle(500, 'READY', otherBackgroundSaga, 42)
      .finish()
      .isDone();
  }).toThrow();
});

test('delegating throws if wrong args', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .throttle(500, 'READY', backgroundSaga, 41)
      .finish()
      .isDone();
  }).toThrow();
});

test('handles yielding instead of delegating', () => {
  testSaga(mainSagaYieldingThrottle)
    .next()
    .call(identity, 'foo')

    .next()
    .throttleFork(500, 'READY', backgroundSaga, 42)

    .finish()
    .isDone();
});

test('yielding throws if wrong delay time', () => {
  expect(_ => {
    testSaga(mainSagaYieldingThrottle)
      .next()
      .call(identity, 'foo')

      .next()
      .throttleFork(250, 'READY', backgroundSaga, 42)

      .finish()
      .isDone();
  }).toThrow();
});

test('yielding throws if a different helper is yielded', () => {
  expect(_ => {
    testSaga(mainSagaYieldingTakeEvery)
      .next()
      .call(identity, 'foo')

      .next()
      .throttleFork(500, 'READY', backgroundSaga, 42)

      .finish()
      .isDone();
  }).toThrow();
});

test('yielding throws if wrong pattern', () => {
  expect(_ => {
    testSaga(mainSagaYieldingThrottle)
      .next()
      .call(identity, 'foo')

      .next()
      .throttleFork(500, 'DONE', backgroundSaga, 42)

      .finish()
      .isDone();
  }).toThrow();
});

test('yielding throws if wrong saga', () => {
  expect(_ => {
    testSaga(mainSagaYieldingThrottle)
      .next()
      .call(identity, 'foo')

      .next()
      .throttleFork(500, 'READY', otherBackgroundSaga, 42)

      .finish()
      .isDone();
  }).toThrow();
});

test('yielding throws if wrong args', () => {
  expect(_ => {
    testSaga(mainSagaYieldingThrottle)
      .next()
      .call(identity, 'foo')

      .next()
      .throttleFork(500, 'READY', backgroundSaga, 41)

      .finish()
      .isDone();
  }).toThrow();
});
