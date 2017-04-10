// @flow
import { call, fork, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { NEXT, handlers } from '../../../src/expectSaga/provideValue';
import { FORK } from '../../../src/shared/keys';
import { warn } from '../../../src/utils/logging';
import * as m from '../../../src/expectSaga/matchers';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

jest.mock('../../../src/utils/logging');

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

test('provideInForkedTasks is deprecated', async () => {
  warn.mockClear();

  function* localSaga() {
    yield put({ type: 'DONE' });
  }

  function createTest() {
    return expectSaga(localSaga)
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
