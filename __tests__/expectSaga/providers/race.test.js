// @flow
import { call, put, race, take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { delay } from '../../../src/utils/async';
import * as m from '../../../src/expectSaga/matchers';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

function* sagaOne() {
  const { first, second } = yield race({
    first: take('FIRST'),
    second: take('SECOND'),
  });

  const { payload } = first || second;

  yield put({ payload, type: 'DONE' });
}

function* sagaTwo(fetchUser) {
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

test('uses provided value for `race`', () => {
  const promise1 = expectSaga(sagaOne)
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

  const promise2 = expectSaga(sagaOne)
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

test('uses static provided values from redux-saga/effects', () => {
  const promise1 = expectSaga(sagaOne)
    .provide([
      [
        race({ first: take('FIRST'), second: take('SECOND') }),
        { first: { type: 'FIRST', payload: 42 } },
      ],
    ])
    .put({ type: 'DONE', payload: 42 })
    .run();

  const promise2 = expectSaga(sagaOne)
    .provide([
      [
        race({ first: take('FIRST'), second: take('SECOND') }),
        { second: { type: 'SECOND', payload: 'hello' } },
      ],
    ])
    .put({ type: 'DONE', payload: 'hello' })
    .run();

  return Promise.all([
    promise1,
    promise2,
  ]);
});

test('uses static provided values from matchers', () => {
  const promise1 = expectSaga(sagaOne)
    .provide([
      [
        m.race({ first: take('FIRST'), second: take('SECOND') }),
        { first: { type: 'FIRST', payload: 42 } },
      ],
    ])
    .put({ type: 'DONE', payload: 42 })
    .run();

  const promise2 = expectSaga(sagaOne)
    .provide([
      [
        m.race({ first: take('FIRST'), second: take('SECOND') }),
        { second: { type: 'SECOND', payload: 'hello' } },
      ],
    ])
    .put({ type: 'DONE', payload: 'hello' })
    .run();

  return Promise.all([
    promise1,
    promise2,
  ]);
});

test('inner providers for `race` work', () => {
  const fetchUser = () => delay(1000).then(() => fakeUser);

  const promise1 = expectSaga(sagaTwo, fetchUser)
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

  const promise2 = expectSaga(sagaTwo, fetchUser)
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

test('inner static providers from redux-saga/effects for `race` work', () => {
  const fetchUser = () => delay(1000).then(() => fakeUser);

  const promise1 = expectSaga(sagaTwo, fetchUser)
    .provide([
      [call(fetchUser, 42), fakeUser],
    ])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .dispatch({ type: 'REQUEST_USER', payload: 42 })
    .run();

  const promise2 = expectSaga(sagaTwo, fetchUser)
    .provide([
      [call(delay, 500), undefined],
    ])
    .put({ type: 'TIMEOUT' })
    .dispatch({ type: 'REQUEST_USER', payload: 42 })
    .run();

  return Promise.all([
    promise1,
    promise2,
  ]);
});

test('inner static providers from matchers for `race` work', () => {
  const fetchUser = () => delay(1000).then(() => fakeUser);

  const promise1 = expectSaga(sagaTwo, fetchUser)
    .provide([
      [m.call(fetchUser, 42), fakeUser],
    ])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .dispatch({ type: 'REQUEST_USER', payload: 42 })
    .run();

  const promise2 = expectSaga(sagaTwo, fetchUser)
    .provide([
      [m.call(delay, 500), undefined],
    ])
    .put({ type: 'TIMEOUT' })
    .dispatch({ type: 'REQUEST_USER', payload: 42 })
    .run();

  return Promise.all([
    promise1,
    promise2,
  ]);
});
