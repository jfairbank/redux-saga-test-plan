// @flow
import { call, put, race, take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { delay } from '../../../src/utils/async';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

test('uses provided value for `race`', () => {
  function* saga() {
    const { first, second } = yield race({
      first: take('FIRST'),
      second: take('SECOND'),
    });

    const { payload } = first || second;

    yield put({ payload, type: 'DONE' });
  }

  const promise1 = expectSaga(saga)
    .provide({
      race: () => ({
        first: {
          type: 'FIRST',
          payload: 42,
        },
      }),
    })
    .put({ type: 'DONE', payload: 42 })
    .run();

  const promise2 = expectSaga(saga)
    .provide({
      race: () => ({
        second: {
          type: 'SECOND',
          payload: 'hello',
        },
      }),
    })
    .put({ type: 'DONE', payload: 'hello' })
    .run();

  return Promise.all([
    promise1,
    promise2,
  ]);
});

test('inner providers for `race` work', () => {
  const fetchUser = () => delay(1000).then(() => fakeUser);

  function* saga() {
    const action = yield take('REQUEST_USER');
    const id = action.payload;

    const { user } = yield race({
      user: call(fetchUser, id),
      timeout: call(delay, 500),
    });

    if (user) {
      yield put({ type: 'RECEIVE_USER', payload: user });
    } else {
      yield put({ type: 'TIMEOUT' });
    }
  }

  const promise1 = expectSaga(saga)
    .provide({
      call({ fn }, next) {
        if (fn === fetchUser) {
          return fakeUser;
        }

        return next();
      },
    })
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .dispatch({ type: 'REQUEST_USER' })
    .run();

  const promise2 = expectSaga(saga)
    .provide({
      call({ fn }, next) {
        if (fn === delay) {
          return undefined;
        }

        return next();
      },
    })
    .put({ type: 'TIMEOUT' })
    .dispatch({ type: 'REQUEST_USER' })
    .run();

  return Promise.all([
    promise1,
    promise2,
  ]);
});
