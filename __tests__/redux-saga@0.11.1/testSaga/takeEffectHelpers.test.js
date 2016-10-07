// @flow
import niv from 'npm-install-version';
import createTestSaga from '../../../src/createTestSaga';

const reduxSaga = niv.require('redux-saga@0.11.1');
const { takeEvery, effects: { call } } = reduxSaga;

const testSaga = createTestSaga(reduxSaga);

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
  yield* takeEvery('READY', backgroundSaga, 42);
}

const mainSagaYielding = (helper) => function* generatedMainSagaYielding() {
  yield call(identity, 'foo');
  yield helper('READY', backgroundSaga, 42);
};

test('handles delegating takeEvery', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('READY', backgroundSaga, 42)
      .finish()
      .isDone();
  }).not.toThrow();
});

test('delegating throws if wrong pattern', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('DONE', backgroundSaga, 42)
      .finish()
      .isDone();
  }).toThrow();
});

test('delegating throws if wrong saga', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('READY', otherBackgroundSaga, 42)
      .finish()
      .isDone();
  }).toThrow();
});

test('delegating throws if wrong args', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('READY', backgroundSaga, 41)
      .finish()
      .isDone();
  }).toThrow();
});

test('does not support yielding', () => {
  expect(_ => {
    testSaga(mainSagaYielding(takeEvery))
      .next()
      .call(identity, 'foo')

      .next()
      .takeEveryFork('READY', backgroundSaga, 42)

      .finish()
      .isDone();
  }).toThrowError(
    'Your version of redux-saga does not support yielding takeEvery directly'
  );
});
