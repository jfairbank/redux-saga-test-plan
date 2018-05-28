// @flow
import { put, putResolve } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

function* putSaga() {
  const result = yield put({ type: 'HELLO' });
  yield put({ type: 'WORLD', payload: result });
}

function* putResolveSaga() {
  const result = yield putResolve({ type: 'HELLO' });
  yield put({ type: 'WORLD', payload: result });
}

test('uses provided value for `put`', () =>
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
    .run());

test('`put` uses static provided values from redux-saga/effects', () =>
  expectSaga(putSaga)
    .provide([[put({ type: 'HELLO' }), 42]])
    .put({ type: 'WORLD', payload: 42 })
    .run());

test('`put` uses static provided values from matchers', () =>
  expectSaga(putSaga)
    .provide([[m.put({ type: 'HELLO' }), 42]])
    .put({ type: 'WORLD', payload: 42 })
    .run());

test('`put` uses partial static provided values from matchers', () =>
  expectSaga(putSaga)
    .provide([[m.put.actionType('HELLO'), 42]])
    .put({ type: 'WORLD', payload: 42 })
    .run());

test('`put` uses dynamic values for static providers', () =>
  expectSaga(putSaga)
    .provide([[m.put.actionType('HELLO'), dynamic(() => 42)]])
    .put({ type: 'WORLD', payload: 42 })
    .run());

test('`put` dynamic values have access to effect', () =>
  expectSaga(putSaga)
    .provide([
      [
        m.put.actionType('HELLO'),
        dynamic(effect => ({
          type: effect.action.type,
          payload: 42,
        })),
      ],
    ])
    .put({
      type: 'WORLD',
      payload: { type: 'HELLO', payload: 42 },
    })
    .run());

test('uses provided value for `putResolve`', () =>
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
    .run());

test('`putResolve` uses static provided values from redux-saga/effects', () =>
  expectSaga(putResolveSaga)
    .provide([[putResolve({ type: 'HELLO' }), 42]])
    .put({ type: 'WORLD', payload: 42 })
    .run());

test('`putResolve` uses static provided values from matchers', () =>
  expectSaga(putResolveSaga)
    .provide([[m.putResolve({ type: 'HELLO' }), 42]])
    .put({ type: 'WORLD', payload: 42 })
    .run());

test('`putResolve` uses partial static provided values from matchers', () =>
  expectSaga(putResolveSaga)
    .provide([[m.putResolve.actionType('HELLO'), 42]])
    .put({ type: 'WORLD', payload: 42 })
    .run());

test('`putResolve` uses dynamic values for static providers', () =>
  expectSaga(putResolveSaga)
    .provide([[m.putResolve.actionType('HELLO'), dynamic(() => 42)]])
    .put({ type: 'WORLD', payload: 42 })
    .run());

test('`putResolve` dynamic values have access to effect', () =>
  expectSaga(putResolveSaga)
    .provide([
      [
        m.putResolve.actionType('HELLO'),
        dynamic(effect => ({
          type: effect.action.type,
          payload: 42,
        })),
      ],
    ])
    .put({
      type: 'WORLD',
      payload: { type: 'HELLO', payload: 42 },
    })
    .run());
