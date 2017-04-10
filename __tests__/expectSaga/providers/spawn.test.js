// @flow
import { call, put, spawn } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

jest.mock('../../../src/utils/logging');

test('uses provided value for `spawn`', () => {
  const fakeTask = { hello: 'world' };

  function* otherSaga() {
    yield 42;
  }

  function* saga() {
    const task = yield spawn(otherSaga);
    yield put({ type: 'DONE', payload: task });
  }

  return expectSaga(saga)
    .provide({
      spawn({ fn }, next) {
        if (fn === otherSaga) {
          return fakeTask;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: fakeTask })
    .run();
});

test('test coverage for no `spawn`', () => {
  const fakeTask = { hello: 'world' };

  function* otherSaga() {
    yield put({ type: 'DONE' });
  }

  function* saga() {
    yield spawn(otherSaga);
  }

  return expectSaga(saga)
    .provide({
      fork({ fn }, next) {
        if (fn === otherSaga) {
          return fakeTask;
        }

        return next();
      },
    })
    .put({ type: 'DONE' })
    .run();
});

test('provides values in spawned sagas', () => {
  const fetchUser = () => 0;

  function* fetchUserSaga() {
    const user = yield call(fetchUser);
    yield put({ type: 'RECEIVE_USER', payload: user });
  }

  function* saga() {
    yield spawn(fetchUserSaga);
  }

  return expectSaga(saga)
    .provide({
      call({ fn }, next) {
        if (fn === fetchUser) {
          return fakeUser;
        }

        return next();
      },
    })
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run();
});
