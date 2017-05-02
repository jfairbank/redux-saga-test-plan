// @flow
import { call, fork, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { NEXT, handlers } from '../../../src/expectSaga/provideValue';
import { FORK } from '../../../src/shared/keys';
import * as m from '../../../src/expectSaga/matchers';
import { dynamic } from '../../../src/expectSaga/providers';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

const fakeTask = { hello: 'world' };
const fetchUser = () => 0;

function* otherSaga() {
  yield 42;
}

function* sagaOne() {
  const task = yield fork(otherSaga);
  yield put({ type: 'DONE', payload: task });
}

function* fetchUserSaga() {
  const user = yield call(fetchUser);
  yield put({ type: 'RECEIVE_USER', payload: user });
}

function* sagaTwo() {
  yield fork(fetchUserSaga);
}

test('uses provided value for `fork`', () => (
  expectSaga(sagaOne)
    .provide({
      fork({ fn }, next) {
        if (fn === otherSaga) {
          return fakeTask;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: fakeTask })
    .run()
));

test('uses static provided values from redux-saga/effects', () => (
  expectSaga(sagaOne)
    .provide([
      [fork(otherSaga), fakeTask],
    ])
    .put({ type: 'DONE', payload: fakeTask })
    .run()
));

test('uses static provided values from matchers', () => (
  expectSaga(sagaOne)
    .provide([
      [m.fork(otherSaga), fakeTask],
    ])
    .put({ type: 'DONE', payload: fakeTask })
    .run()
));

test('uses partial static provided values from matchers', () => (
  expectSaga(sagaOne)
    .provide([
      [m.fork.fn(otherSaga), fakeTask],
    ])
    .put({ type: 'DONE', payload: fakeTask })
    .run()
));

test('uses dynamic values for static providers', () => (
  expectSaga(sagaOne)
    .provide([
      [m.fork.fn(otherSaga), dynamic(() => fakeTask)],
    ])
    .put({ type: 'DONE', payload: fakeTask })
    .run()
));

test('dynamic values have access to effect', () => (
  expectSaga(sagaOne)
    .provide([
      [m.fork.fn(otherSaga), dynamic(({ fn }) => {
        expect(fn).toBe(otherSaga);
        return fakeTask;
      })],
    ])
    .put({ type: 'DONE', payload: fakeTask })
    .run()
));

test('provides values in forked sagas', () => (
  expectSaga(sagaTwo)
    .provide({
      call({ fn }, next) {
        if (fn === fetchUser) {
          return fakeUser;
        }

        return next();
      },
    })
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run()
));

test('uses static provided values in forked sagas from redux-saga/effects', () => (
  expectSaga(sagaTwo)
    .provide([
      [call(fetchUser), fakeUser],
    ])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run()
));

test('uses static provided values in forked sagas from matchers', () => (
  expectSaga(sagaTwo)
    .provide([
      [m.call(fetchUser), fakeUser],
    ])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run()
));

test('uses partial static provided values in forked sagas from matchers', () => (
  expectSaga(sagaTwo)
    .provide([
      [m.call.fn(fetchUser), fakeUser],
    ])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run()
));

test('forked sagas dynamic values for static providers', () => (
  expectSaga(sagaTwo)
    .provide([
      [m.call.fn(fetchUser), dynamic(() => fakeUser)],
    ])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run()
));

test('forked sagas dynamic values have access to effect', () => (
  expectSaga(sagaTwo)
    .provide([
      [m.call.fn(fetchUser), dynamic(({ fn }) => {
        expect(fn).toBe(fetchUser);
        return fakeUser;
      })],
    ])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run()
));

test('provides values in deeply forked sagas', () => {
  function* anotherSaga() {
    yield fork(fetchUserSaga);
  }

  function* someSaga() {
    yield fork(anotherSaga);
  }

  function* localSaga() {
    yield fork(someSaga);
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

test('provides values in deeply forked and called sagas', () => {
  function* anotherSaga() {
    yield fork(fetchUserSaga);
  }

  function* someSaga() {
    yield call(anotherSaga);
  }

  function* localSaga() {
    yield fork(someSaga);
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

test('test coverage for FORK handler', () => {
  const actual = handlers[FORK]({}, {});
  expect(actual).toBe(NEXT);
});
