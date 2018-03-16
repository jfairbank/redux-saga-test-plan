// @flow
import { all, call, fork, put, takeEvery, takeLatest } from 'redux-saga/effects';
import expectSaga from 'expectSaga';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

jest.mock('utils/logging');

test('provides values in takeEvery workers', () => {
  const fetchUser = () => 0;

  function* fooSaga(arg1, arg2, action) {
    const user = yield call(fetchUser);

    yield put({
      type: 'RECEIVE_USER',
      payload: user,
      meta: { action, args: [arg1, arg2] },
    });
  }

  function* saga() {
    yield takeEvery('REQUEST_USER', fooSaga, 42, 'hello');
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
    .put({
      type: 'RECEIVE_USER',
      payload: fakeUser,
      meta: {
        action: { type: 'REQUEST_USER' },
        args: [42, 'hello'],
      },
    })
    .dispatch({ type: 'REQUEST_USER' })
    .run({ silenceTimeout: true });
});

test('provides values in takeLatest workers', () => {
  const fetchUser = () => 0;

  function* fooSaga(arg1, arg2, action) {
    const user = yield call(fetchUser);

    yield put({
      type: 'RECEIVE_USER',
      payload: user,
      meta: { action, args: [arg1, arg2] },
    });
  }

  function* saga() {
    yield takeLatest('REQUEST_USER', fooSaga, 42, 'hello');
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
    .put({
      type: 'RECEIVE_USER',
      payload: fakeUser,
      meta: {
        action: { type: 'REQUEST_USER' },
        args: [42, 'hello'],
      },
    })
    .dispatch({ type: 'REQUEST_USER' })
    .run({ silenceTimeout: true });
});

test('provides values in parallel takeEvery workers', () => {
  const fetchUser = () => 0;

  function* otherSaga(arg1, arg2, action) {
    yield put({
      type: 'OTHER',
      meta: { action, args: [arg1, arg2] },
    });
  }

  function* fooSaga(arg1, arg2, action) {
    const user = yield call(fetchUser);

    yield put({
      type: 'RECEIVE_USER',
      payload: user,
      meta: { action, args: [arg1, arg2] },
    });
  }

  function* saga() {
    yield [
      takeEvery('REQUEST_USER', fooSaga, 42, 'hello'),
      takeLatest('REQUEST_OTHER', otherSaga, 13, 'world'),
    ];
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
    .put({
      type: 'RECEIVE_USER',
      payload: fakeUser,
      meta: {
        action: { type: 'REQUEST_USER' },
        args: [42, 'hello'],
      },
    })
    .put({
      type: 'OTHER',
      meta: {
        action: { type: 'REQUEST_OTHER' },
        args: [13, 'world'],
      },
    })
    .dispatch({ type: 'REQUEST_USER' })
    .dispatch({ type: 'REQUEST_OTHER' })
    .run({ silenceTimeout: true });
});

test('provides values in `all` takeEvery workers', () => {
  const fetchUser = () => 0;

  function* otherSaga(arg1, arg2, action) {
    yield put({
      type: 'OTHER',
      meta: { action, args: [arg1, arg2] },
    });
  }

  function* fooSaga(arg1, arg2, action) {
    const user = yield call(fetchUser);

    yield put({
      type: 'RECEIVE_USER',
      payload: user,
      meta: { action, args: [arg1, arg2] },
    });
  }

  function* saga() {
    yield all([
      takeEvery('REQUEST_USER', fooSaga, 42, 'hello'),
      takeLatest('REQUEST_OTHER', otherSaga, 13, 'world'),
    ]);
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
    .put({
      type: 'RECEIVE_USER',
      payload: fakeUser,
      meta: {
        action: { type: 'REQUEST_USER' },
        args: [42, 'hello'],
      },
    })
    .put({
      type: 'OTHER',
      meta: {
        action: { type: 'REQUEST_OTHER' },
        args: [13, 'world'],
      },
    })
    .dispatch({ type: 'REQUEST_USER' })
    .dispatch({ type: 'REQUEST_OTHER' })
    .run({ silenceTimeout: true });
});

test('provides fork values in takeEvery workers', () => {
  const fakeTask = { hello: 'world' };

  function* otherSaga() {
    yield 42;
  }

  function* fooForkSaga(arg1, arg2, action) {
    const task = yield fork(otherSaga);
    yield put({
      type: 'FORKED_TASK',
      payload: task,
      meta: { action, args: [arg1, arg2] },
    });
  }

  function* saga() {
    yield takeEvery('REQUEST_USER', fooForkSaga, 42, 'hello');
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
    .put({
      type: 'FORKED_TASK',
      payload: fakeTask,
      meta: {
        action: { type: 'REQUEST_USER' },
        args: [42, 'hello'],
      },
    })
    .dispatch({ type: 'REQUEST_USER' })
    .run({ silenceTimeout: true });
});

test('provides fork values in takeLatest workers', () => {
  const fakeTask = { hello: 'world' };

  function* otherSaga() {
    yield 42;
  }

  function* fooForkSaga(arg1, arg2, action) {
    const task = yield fork(otherSaga);
    yield put({
      type: 'FORKED_TASK',
      payload: task,
      meta: { action, args: [arg1, arg2] },
    });
  }

  function* saga() {
    yield takeLatest('REQUEST_USER', fooForkSaga, 42, 'hello');
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
    .put({
      type: 'FORKED_TASK',
      payload: fakeTask,
      meta: {
        action: { type: 'REQUEST_USER' },
        args: [42, 'hello'],
      },
    })
    .dispatch({ type: 'REQUEST_USER' })
    .run({ silenceTimeout: true });
});
