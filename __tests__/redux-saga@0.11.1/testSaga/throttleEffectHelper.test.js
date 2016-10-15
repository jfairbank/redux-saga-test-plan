// @flow
import niv from 'npm-install-version';
import createTestSaga from '../../../src/createTestSaga';

const reduxSaga = niv.require('redux-saga@0.11.1');
const { throttle, effects: { call } } = reduxSaga;

const testSaga = createTestSaga(reduxSaga);

function identity(value) {
  return value;
}

function* backgroundSaga(action, value) {
  yield call(identity, value);
}

function* mainSaga() {
  yield call(identity, 'foo');
  yield* throttle(500, 'READY', backgroundSaga, 42);
}

function* mainSagaYielding() {
  yield call(identity, 'foo');
}

test('does not support delegating throttle', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .throttle(500, 'READY', backgroundSaga, 42)
      .finish()
      .isDone();
  }).toThrowError(
    'Your version of redux-saga does not support throttle.'
  );
});

test('does not support yielding throttle', () => {
  expect(_ => {
    testSaga(mainSagaYielding)
      .next()
      .throttleFork(500, 'READY', backgroundSaga, 42);
  }).toThrowError(
    'Your version of redux-saga does not support throttle.'
  );
});
