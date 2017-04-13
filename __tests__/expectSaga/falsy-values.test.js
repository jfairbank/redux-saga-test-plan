import { call, put, race } from 'redux-saga/effects';
import { expectSaga } from '../../src';

const returnFalse = () => false;
const returnNull = () => null;
const returnUndefined = () => undefined;
const returnEmptyString = () => '';
const return0 = () => 0;
const returnNaN = () => NaN;

// https://github.com/jfairbank/redux-saga-test-plan/issues/94
test('can receive falsy values from calls', () => {
  function* saga() {
    yield call(returnFalse);
    yield call(returnNull);
    yield call(returnUndefined);
    yield call(returnEmptyString);
    yield call(return0);
    yield call(returnNaN);
    yield put({ type: 'DONE' });
  }

  return expectSaga(saga)
    .put({ type: 'DONE' })
    .run();
});

test('can receive falsy values from calls in parallel', () => {
  function* saga() {
    yield [
      call(returnFalse),
      call(returnNull),
      call(returnUndefined),
      call(returnEmptyString),
      call(return0),
      call(returnNaN),
    ];

    yield put({ type: 'DONE' });
  }

  return expectSaga(saga)
    .put({ type: 'DONE' })
    .run();
});

test('can receive falsy values from calls in race', () => {
  function* saga() {
    yield race({
      false: call(returnFalse),
      null: call(returnNull),
      undefined: call(returnUndefined),
      emptyString: call(returnEmptyString),
      zero: call(return0),
      NaN: call(returnNaN),
    });

    yield put({ type: 'DONE' });
  }

  return expectSaga(saga)
    .put({ type: 'DONE' })
    .run();
});

test('can receive falsy values from providers', () => {
  function* saga() {
    yield call(returnFalse);
    yield call(returnNull);
    yield call(returnUndefined);
    yield call(returnEmptyString);
    yield call(return0);
    yield call(returnNaN);
    yield put({ type: 'DONE' });
  }

  return expectSaga(saga)
    .provide([
      [call(returnFalse), false],
      [call(returnNull), null],
      [call(returnUndefined), undefined],
      [call(returnEmptyString), ''],
      [call(return0), 0],
      [call(returnNaN), NaN],
    ])
    .put({ type: 'DONE' })
    .run();
});

test('can receive falsy values from providers in parallel', () => {
  function* saga() {
    yield [
      call(returnFalse),
      call(returnNull),
      call(returnUndefined),
      call(returnEmptyString),
      call(return0),
      call(returnNaN),
    ];

    yield put({ type: 'DONE' });
  }

  return expectSaga(saga)
    .provide([
      [call(returnFalse), false],
      [call(returnNull), null],
      [call(returnUndefined), undefined],
      [call(returnEmptyString), ''],
      [call(return0), 0],
      [call(returnNaN), NaN],
    ])
    .put({ type: 'DONE' })
    .run();
});
