// @flow
import test from 'ava';
import { takeEvery, takeLatest } from 'redux-saga';
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

const mainSagaYielding = (helper) => function* generatedMainSagaYielding() {
  yield call(identity, 'foo');
  yield helper('READY', backgroundSaga, 42);
};

test('handles delegating takeEvery', t => {
  t.notThrows(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('READY', backgroundSaga, 42)
      .finish()
      .isDone();
  });
});

test('delegating throws if wrong pattern', t => {
  t.throws(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('DONE', backgroundSaga, 42)
      .finish()
      .isDone();
  });
});

test('delegating throws if wrong saga', t => {
  t.throws(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('READY', otherBackgroundSaga, 42)
      .finish()
      .isDone();
  });
});

test('delegating throws if wrong args', t => {
  t.throws(_ => {
    testSaga(mainSaga)
      .next()
      .call(identity, 'foo')
      .takeEvery('READY', backgroundSaga, 41)
      .finish()
      .isDone();
  });
});

test('handles yielding instead of delegating', () => {
  testSaga(mainSagaYielding(takeEvery))
    .next()
    .call(identity, 'foo')

    .next()
    .takeEveryFork('READY', backgroundSaga, 42)

    .finish()
    .isDone();
});

test('yielding throws if a different helper is yielded', t => {
  t.throws(_ => {
    testSaga(mainSagaYielding(takeLatest))
      .next()
      .call(identity, 'foo')

      .next()
      .takeEveryFork('READY', backgroundSaga, 42)

      .finish()
      .isDone();
  });
});

test('yielding throws if wrong pattern', t => {
  t.throws(_ => {
    testSaga(mainSagaYielding(takeEvery))
      .next()
      .call(identity, 'foo')

      .next()
      .takeEveryFork('DONE', backgroundSaga, 42)

      .finish()
      .isDone();
  });
});

test('yielding throws if wrong saga', t => {
  t.throws(_ => {
    testSaga(mainSagaYielding(takeEvery))
      .next()
      .call(identity, 'foo')

      .next()
      .takeEveryFork('READY', otherBackgroundSaga, 42)

      .finish()
      .isDone();
  });
});

test('yielding throws if wrong args', t => {
  t.throws(_ => {
    testSaga(mainSagaYielding(takeEvery))
      .next()
      .call(identity, 'foo')

      .next()
      .takeEveryFork('READY', backgroundSaga, 41)

      .finish()
      .isDone();
  });
});
