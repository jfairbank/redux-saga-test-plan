// @flow
import { put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

test('uses provided value for `put`', () => {
  function* saga() {
    const result = yield put({ type: 'HELLO' });
    yield put({ type: 'WORLD', payload: result });
  }

  return expectSaga(saga)
    .provide({
      put({ action }, next) {
        if (action.type === 'HELLO') {
          return 42;
        }

        return next();
      },
    })
    .put({ type: 'WORLD', payload: 42 })
    .run();
});

test('uses provided value for `put.resolve`', () => {
  function* saga() {
    const result = yield put.resolve({ type: 'HELLO' });
    yield put({ type: 'WORLD', payload: result });
  }

  return expectSaga(saga)
    .provide({
      put({ resolve, action }, next) {
        if (resolve && action.type === 'HELLO') {
          return 42;
        }

        return next();
      },
    })
    .put({ type: 'WORLD', payload: 42 })
    .run();
});
