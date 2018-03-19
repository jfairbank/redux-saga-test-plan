// @flow
import { call, put, spawn } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

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
  const task = yield spawn(otherSaga);
  yield put({ type: 'DONE', payload: task });
}

function* fetchUserSaga() {
  const user = yield call(fetchUser);
  yield put({ type: 'RECEIVE_USER', payload: user });
}

function* sagaTwo() {
  yield spawn(fetchUserSaga);
}

test('uses provided value for `spawn`', () =>
  expectSaga(sagaOne)
    .provide({
      spawn({ fn }, next) {
        if (fn === otherSaga) {
          return fakeTask;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: fakeTask })
    .run());

test('uses static provided values from redux-saga/effects', () =>
  expectSaga(sagaOne)
    .provide([[spawn(otherSaga), fakeTask]])
    .put({ type: 'DONE', payload: fakeTask })
    .run());

test('uses static provided values from matchers', () =>
  expectSaga(sagaOne)
    .provide([[m.spawn(otherSaga), fakeTask]])
    .put({ type: 'DONE', payload: fakeTask })
    .run());

test('uses partial static provided values from matchers', () =>
  expectSaga(sagaOne)
    .provide([[m.spawn.fn(otherSaga), fakeTask]])
    .put({ type: 'DONE', payload: fakeTask })
    .run());

test('test coverage for no `spawn`', () => {
  function* localOtherSaga() {
    yield put({ type: 'DONE' });
  }

  function* localSaga() {
    yield spawn(localOtherSaga);
  }

  return expectSaga(localSaga)
    .provide({
      fork({ fn }, next) {
        if (fn === localOtherSaga) {
          return fakeTask;
        }

        return next();
      },
    })
    .put({ type: 'DONE' })
    .run();
});

test('uses dynamic values for static providers', () =>
  expectSaga(sagaOne)
    .provide([[m.spawn.fn(otherSaga), dynamic(() => fakeTask)]])
    .put({ type: 'DONE', payload: fakeTask })
    .run());

test('dynamic values have access to effect', () =>
  expectSaga(sagaOne)
    .provide([
      [
        m.spawn.fn(otherSaga),
        dynamic(({ fn }) => {
          expect(fn).toBe(otherSaga);
          return fakeTask;
        }),
      ],
    ])
    .put({ type: 'DONE', payload: fakeTask })
    .run());

test('provides values in spawned sagas', () =>
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
    .run());

test('uses static provided values in spawned sagas from redux-saga/effects', () =>
  expectSaga(sagaTwo)
    .provide([[call(fetchUser), fakeUser]])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run());

test('uses static provided values in spawned sagas from matchers', () =>
  expectSaga(sagaTwo)
    .provide([[m.call(fetchUser), fakeUser]])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run());

test('uses partial static provided values in spawned sagas from matchers', () =>
  expectSaga(sagaTwo)
    .provide([[m.call.fn(fetchUser), fakeUser]])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run());

test('spawned sagas dynamic values for static providers', () =>
  expectSaga(sagaTwo)
    .provide([[m.call.fn(fetchUser), dynamic(() => fakeUser)]])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run());

test('spawned sagas dynamic values have access to effect', () =>
  expectSaga(sagaTwo)
    .provide([
      [
        m.call.fn(fetchUser),
        dynamic(({ fn }) => {
          expect(fn).toBe(fetchUser);
          return fakeUser;
        }),
      ],
    ])
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run());

test('provides spawn values in nested spawns', () => {
  function* spawnSaga(arg1, arg2) {
    const task = yield spawn(otherSaga);
    yield put({
      type: 'SPAWNED_TASK',
      payload: task,
      meta: { args: [arg1, arg2] },
    });
  }

  function* saga() {
    yield spawn(spawnSaga, 42, 'hello');
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
    .put({
      type: 'SPAWNED_TASK',
      payload: fakeTask,
      meta: {
        args: [42, 'hello'],
      },
    })
    .run();
});
