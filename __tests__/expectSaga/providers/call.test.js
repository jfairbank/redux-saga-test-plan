// @flow
import { call, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import * as m from '../../../src/expectSaga/matchers';
import { dynamic } from '../../../src/expectSaga/providers';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

const apiFunction = () => 0;
const otherApiFunction = () => 1;

function* saga() {
  const value = yield call(apiFunction, 21);
  const otherValue = yield call(otherApiFunction);
  yield put({ type: 'DONE', payload: value + otherValue });
}

test('uses provided value for `call`', () => (
  expectSaga(saga)
    .provide({
      call({ fn, args: [arg] }, next) {
        if (fn === apiFunction) {
          return arg * 2;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .run()
));

test('test coverage for no `call`', () => {
  const localApiFunction = () => 21;

  function* localSaga() {
    const value = yield call(localApiFunction);
    yield put({ type: 'DONE', payload: value * 2 });
  }

  return expectSaga(localSaga)
    .provide({
      fork({ fn }, next) {
        if (fn === localApiFunction) {
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

  function* localSaga() {
    yield call(someSaga);
  }

  return expectSaga(localSaga)
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

test('uses static provided values from redux-saga/effects', () => (
  expectSaga(saga)
    .provide([
      [call(apiFunction, 21), 42],
    ])
    .put({ type: 'DONE', payload: 43 })
    .run()
));

test('uses static provided values from matchers', () => (
  expectSaga(saga)
    .provide([
      [m.call(apiFunction, 21), 42],
    ])
    .put({ type: 'DONE', payload: 43 })
    .run()
));

test('uses partial static provided values from matchers', () => (
  expectSaga(saga)
    .provide([
      [m.call.fn(apiFunction), 42],
    ])
    .put({ type: 'DONE', payload: 43 })
    .run()
));

test('uses dynamic values for static providers', () => (
  expectSaga(saga)
    .provide([
      [m.call.fn(apiFunction), dynamic(() => 42)],
    ])
    .put({ type: 'DONE', payload: 43 })
    .run()
));

test('dynamic values have access to effect', () => (
  expectSaga(saga)
    .provide([
      [m.call.fn(apiFunction), dynamic(effect => effect.args[0] * 3)],
    ])
    .put({ type: 'DONE', payload: 64 })
    .run()
));
