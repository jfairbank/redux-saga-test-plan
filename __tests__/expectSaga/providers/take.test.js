// @flow
import { put, take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

test('provides actions for `take`', () => {
  function* saga() {
    const action = yield take('HELLO');
    const otherAction = yield take('WORLD');
    const payload = action.payload + otherAction.payload;

    yield put({ payload, type: 'DONE' });
  }

  return expectSaga(saga)
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
    .run();
});

test('provides actions for `take.maybe`', () => {
  function* saga() {
    const action = yield take.maybe('HELLO');
    const otherAction = yield take.maybe('WORLD');
    const payload = action.payload + otherAction.payload;

    yield put({ payload, type: 'DONE' });
  }

  return expectSaga(saga)
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
    .run();
});
