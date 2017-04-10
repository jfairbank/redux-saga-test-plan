// @flow
import { call, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

test('uses provided value for `call`', () => {
  const apiFunction = () => 0;
  const otherApiFunction = () => 1;

  function* saga() {
    const value = yield call(apiFunction, 21);
    const otherValue = yield call(otherApiFunction);
    yield put({ type: 'DONE', payload: value + otherValue });
  }

  return expectSaga(saga)
    .provide({
      call({ fn, args: [arg] }, next) {
        if (fn === apiFunction) {
          return arg * 2;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .run();
});

test('test coverage for no `call`', () => {
  const apiFunction = () => 21;

  function* saga() {
    const value = yield call(apiFunction);

    yield put({ type: 'DONE', payload: value * 2 });
  }

  return expectSaga(saga)
    .provide({
      fork({ fn }, next) {
        if (fn === apiFunction) {
          return 10;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 42 })
    .run();
});

test('provides values in deeply called sagas', () => {
  const fetchUser = () => 0;

  function* fetchUserSaga() {
    const user = yield call(fetchUser);
    yield put({ type: 'RECEIVE_USER', payload: user });
  }

  function* anotherSaga() {
    yield call(fetchUserSaga);
  }

  function* someSaga() {
    yield call(anotherSaga);
  }

  function* saga() {
    yield call(someSaga);
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
