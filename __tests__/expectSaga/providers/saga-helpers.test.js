// @flow
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

jest.mock('../../../src/utils/logging');

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
