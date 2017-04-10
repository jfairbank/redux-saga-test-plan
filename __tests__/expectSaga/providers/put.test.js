// @flow
import { put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import * as m from '../../../src/expectSaga/matchers';

function* putSaga() {
  const result = yield put({ type: 'HELLO' });
  yield put({ type: 'WORLD', payload: result });
}

function* putResolveSaga() {
  const result = yield put.resolve({ type: 'HELLO' });
  yield put({ type: 'WORLD', payload: result });
}

test('uses provided value for `put`', () => (
  expectSaga(putSaga)
    .provide({
      put({ action }, next) {
        if (action.type === 'HELLO') {
          return 42;
        }

        return next();
      },
    })
    .put({ type: 'WORLD', payload: 42 })
    .run()
));

test('`put` uses static provided values from redux-saga/effects', () => (
  expectSaga(putSaga)
    .provide([
      [put({ type: 'HELLO' }), 42],
    ])
    .put({ type: 'WORLD', payload: 42 })
    .run()
));

test('`put` uses static provided values from matchers', () => (
  expectSaga(putSaga)
    .provide([
      [m.put({ type: 'HELLO' }), 42],
    ])
    .put({ type: 'WORLD', payload: 42 })
    .run()
));

test('`put` uses partial static provided values from matchers', () => (
  expectSaga(putSaga)
    .provide([
      [m.put.actionType('HELLO'), 42],
    ])
    .put({ type: 'WORLD', payload: 42 })
    .run()
));

test('uses provided value for `put.resolve`', () => (
  expectSaga(putResolveSaga)
    .provide({
      put({ resolve, action }, next) {
        if (resolve && action.type === 'HELLO') {
          return 42;
        }

        return next();
      },
    })
    .put({ type: 'WORLD', payload: 42 })
    .run()
));

test('`put.resolve` uses static provided values from redux-saga/effects', () => (
  expectSaga(putResolveSaga)
    .provide([
      [put.resolve({ type: 'HELLO' }), 42],
    ])
    .put({ type: 'WORLD', payload: 42 })
    .run()
));

test('`put.resolve` uses static provided values from matchers', () => (
  expectSaga(putResolveSaga)
    .provide([
      [m.put.resolve({ type: 'HELLO' }), 42],
    ])
    .put({ type: 'WORLD', payload: 42 })
    .run()
));

test('`put.resolve` uses partial static provided values from matchers', () => (
  expectSaga(putResolveSaga)
    .provide([
      [m.put.resolve.actionType('HELLO'), 42],
    ])
    .put({ type: 'WORLD', payload: 42 })
    .run()
));
