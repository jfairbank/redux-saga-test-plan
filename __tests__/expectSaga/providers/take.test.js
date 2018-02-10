// @flow
import { put, take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

function* takeSaga() {
  const action = yield take('HELLO');
  const otherAction = yield take('WORLD');
  const payload = action.payload + otherAction.payload;

  yield put({ payload, type: 'DONE' });
}

function* takeMaybeSaga() {
  const action = yield take.maybe('HELLO');
  const otherAction = yield take.maybe('WORLD');
  const payload = action.payload + otherAction.payload;

  yield put({ payload, type: 'DONE' });
}

test('provides actions for `take`', () =>
  expectSaga(takeSaga)
    .provide({
      take({ pattern }, next) {
        if (pattern === 'HELLO') {
          return { type: 'HELLO', payload: 42 };
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run());

test('`take` uses static provided values from redux-saga/effects', () =>
  expectSaga(takeSaga)
    .provide([[take('HELLO'), { type: 'HELLO', payload: 42 }]])
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run());

test('`take` uses static provided values from matchers', () =>
  expectSaga(takeSaga)
    .provide([[m.take('HELLO'), { type: 'HELLO', payload: 42 }]])
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run());

test('`take` uses dynamic values for static providers', () =>
  expectSaga(takeSaga)
    .provide([
      [m.take('HELLO'), dynamic(() => ({ type: 'HELLO', payload: 42 }))],
    ])
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run());

test('`take` dynamic values have access to effect', () =>
  expectSaga(takeSaga)
    .provide([
      [
        m.take('HELLO'),
        dynamic(({ pattern }) => {
          expect(pattern).toBe('HELLO');
          return { type: 'HELLO', payload: 42 };
        }),
      ],
    ])
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run());

test('provides actions for `take.maybe`', () =>
  expectSaga(takeMaybeSaga)
    .provide({
      take({ maybe, pattern }, next) {
        if (maybe && pattern === 'HELLO') {
          return { type: 'HELLO', payload: 42 };
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run());

test('`take.maybe` uses static provided values from redux-saga/effects', () =>
  expectSaga(takeMaybeSaga)
    .provide([[take.maybe('HELLO'), { type: 'HELLO', payload: 42 }]])
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run());

test('`take.maybe` uses static provided values from matchers', () =>
  expectSaga(takeMaybeSaga)
    .provide([[m.take.maybe('HELLO'), { type: 'HELLO', payload: 42 }]])
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run());

test('`take.maybe` uses dynamic values for static providers', () =>
  expectSaga(takeMaybeSaga)
    .provide([
      [m.take.maybe('HELLO'), dynamic(() => ({ type: 'HELLO', payload: 42 }))],
    ])
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run());

test('`take.maybe` dynamic values have access to effect', () =>
  expectSaga(takeMaybeSaga)
    .provide([
      [
        m.take.maybe('HELLO'),
        dynamic(({ pattern }) => {
          expect(pattern).toBe('HELLO');
          return { type: 'HELLO', payload: 42 };
        }),
      ],
    ])
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run());
