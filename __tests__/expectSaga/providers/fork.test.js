// @flow
import { call, fork, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { NEXT, handlers } from '../../../src/expectSaga/provideValue';
import { FORK } from '../../../src/shared/keys';
import { warn } from '../../../src/utils/logging';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

jest.mock('../../../src/utils/logging');

test('uses provided value for `fork`', () => {
  const fakeTask = { hello: 'world' };

  function* otherSaga() {
    yield 42;
  }

  function* saga() {
    const task = yield fork(otherSaga);
    yield put({ type: 'DONE', payload: task });
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
    .put({ type: 'DONE', payload: fakeTask })
    .run();
});

test('provides values in forked sagas', () => {
  const fetchUser = () => 0;

  function* fetchUserSaga() {
    const user = yield call(fetchUser);
    yield put({ type: 'RECEIVE_USER', payload: user });
  }

  function* saga() {
    yield fork(fetchUserSaga);
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

test('provides values in deeply forked sagas', () => {
  const fetchUser = () => 0;

  function* fetchUserSaga() {
    const user = yield call(fetchUser);
    yield put({ type: 'RECEIVE_USER', payload: user });
  }

  function* anotherSaga() {
    yield fork(fetchUserSaga);
  }

  function* someSaga() {
    yield fork(anotherSaga);
  }

  function* saga() {
    yield fork(someSaga);
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

test('provides values in deeply forked and called sagas', () => {
  const fetchUser = () => 0;

  function* fetchUserSaga() {
    const user = yield call(fetchUser);
    yield put({ type: 'RECEIVE_USER', payload: user });
  }

  function* anotherSaga() {
    yield fork(fetchUserSaga);
  }

  function* someSaga() {
    yield call(anotherSaga);
  }

  function* saga() {
    yield fork(someSaga);
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

test('test coverage for FORK handler', () => {
  const actual = handlers[FORK]({}, {});
  expect(actual).toBe(NEXT);
});

test('provideInForkedTasks is deprecated', async () => {
  warn.mockClear();

  function* saga() {
    yield put({ type: 'DONE' });
  }

  function createTest() {
    return expectSaga(saga)
      .provide({ provideInForkedTasks: true })
      .put({ type: 'DONE' })
      .run();
  }

  await Promise.all([
    createTest(),
    createTest(),
  ]);

  const [[message]] = warn.mock.calls;

  expect(warn).toHaveBeenCalledTimes(1);
  expect(message).toMatch(/remove the provideInForkedTasks/);
});
