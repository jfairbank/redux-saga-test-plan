// @flow
import { call, put } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

const object = {
  apiFunction: () => 0,
  otherApiFunction: () => 1,
};

function* saga() {
  const value = yield call([object, 'apiFunction'], 21);
  const otherValue = yield call([object, 'otherApiFunction']);
  yield put({ type: 'DONE', payload: value + otherValue });
}

test('uses provided value for `call` with method string', () => (
  expectSaga(saga)
    .provide({
      call({ fn, args: [arg] }, next) {
        if (fn === object.apiFunction) {
          return arg * 2;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .run()
));

test('provides values in deeply called sagas', () => {
  const context = {
    fetchUser: () => 0,
  };

  const sagas = {
    * fetchUserSaga() {
      const user = yield call([context, 'fetchUser']);
      yield put({ type: 'RECEIVE_USER', payload: user });
    },

    * anotherSaga() {
      yield call([sagas, 'fetchUserSaga']);
    },

    * someSaga() {
      yield call([sagas, 'anotherSaga']);
    },
  };


  function* localSaga() {
    yield call([sagas, 'someSaga']);
  }

  return expectSaga(localSaga)
    .provide({
      call({ fn }, next) {
        if (fn === context.fetchUser) {
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
      [call([object, 'apiFunction'], 21), 42],
    ])
    .put({ type: 'DONE', payload: 43 })
    .run()
));

test('uses static provided values from matchers', () => (
  expectSaga(saga)
    .provide([
      [m.call([object, 'apiFunction'], 21), 42],
    ])
    .put({ type: 'DONE', payload: 43 })
    .run()
));

test('uses partial static provided values from matchers', () => (
  expectSaga(saga)
    .provide([
      [m.call.fn(object.apiFunction), 42],
    ])
    .put({ type: 'DONE', payload: 43 })
    .run()
));

test('uses dynamic values for static providers', () => (
  expectSaga(saga)
    .provide([
      [m.call.fn(object.apiFunction), dynamic(() => 42)],
    ])
    .put({ type: 'DONE', payload: 43 })
    .run()
));

test('dynamic values have access to effect', () => (
  expectSaga(saga)
    .provide([
      [m.call.fn(object.apiFunction), dynamic(effect => effect.args[0] * 3)],
    ])
    .put({ type: 'DONE', payload: 64 })
    .run()
));
