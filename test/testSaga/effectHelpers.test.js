// @flow
import test from 'ava';
import { takeEvery } from 'redux-saga';
import { call } from 'redux-saga/effects';
import { testSaga } from '../../src';

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

test('handles takeEvery', t => {
  t.notThrows(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('READY', backgroundSaga, 42)
      .finish()
      .isDone();
  });
});

test('throws if wrong pattern', t => {
  t.throws(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('DONE', backgroundSaga, 42)
      .finish()
      .isDone();
  });
});

test('throws if wrong saga', t => {
  t.throws(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('READY', otherBackgroundSaga, 42)
      .finish()
      .isDone();
  });
});

test('throws if wrong args', t => {
  t.throws(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('READY', backgroundSaga, 41)
      .finish()
      .isDone();
  });
});
