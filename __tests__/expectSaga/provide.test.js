// @flow
import {
  actionChannel,
  apply,
  call,
  cancel,
  cancelled,
  cps,
  flush,
  fork,
  join,
  put,
  race,
  select,
  spawn,
  take,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';

import { createMockTask } from 'redux-saga/utils';
import { expectSaga } from '../../src';
import { delay } from '../../src/utils/async';
import { NO_FAKE_VALUE, handlers } from '../../src/expectSaga/provideValue';
import { FORK, PARALLEL } from '../../src/shared/keys';
import { warn } from '../../src/utils/logging';

const fakeChannel = {
  take() {},
  close() {},
};

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

jest.mock('../../src/utils/logging');

test('uses provided value for `actionChannel`', () => {
  function* saga() {
    const channel = yield actionChannel('FOO');
    const otherChannel = yield actionChannel('BAR');

    const [action, otherAction] = yield [
      take(channel),
      take(otherChannel),
    ];

    const payload = action.payload + otherAction.payload;

    yield put({ payload, type: 'DONE' });
  }

  return expectSaga(saga)
    .provide({
      actionChannel({ pattern }, next) {
        if (pattern === 'FOO') {
          return fakeChannel;
        }

        return next();
      },

      take({ channel }, next) {
        if (channel === fakeChannel) {
          return { type: 'HELLO', payload: 40 };
        }

        if (channel) {
          return { type: 'WORLD', payload: 2 };
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 42 })
    .run();
});

test('uses provided value for `apply` via `call`', () => {
  const context = {};
  const apiFunction = () => 0;
  const otherContext = {};
  const otherApiFunction = () => 1;

  function* saga() {
    const value = yield apply(context, apiFunction, [21]);
    const otherValue = yield apply(otherContext, otherApiFunction);
    yield put({ type: 'DONE', payload: value + otherValue });
  }

  return expectSaga(saga)
    .provide({
      call({ fn, context: ctx, args: [arg] }, next) {
        if (ctx === context && fn === apiFunction) {
          return arg * 2;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .run();
});

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

test('uses provided value for `cancel`', () => {
  const fakeTask = createMockTask();

  function* backgroundSaga() {
    yield 42;
  }

  function* saga() {
    const task = yield fork(backgroundSaga);
    const value = yield cancel(task);

    yield put({ type: 'DONE', payload: value });
  }

  return expectSaga(saga)
    .provide({
      cancel(task, next) {
        if (task === fakeTask) {
          return 'cancelled';
        }

        return next();
      },

      fork: () => fakeTask,
    })
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('uses provided value for `cancelled`', () => {
  function* saga() {
    if (yield cancelled()) {
      yield put({ type: 'CANCELLED' });
    } else {
      yield put({ type: 'NOT_CANCELLED' });
    }
  }

  return expectSaga(saga)
    .provide({
      cancelled: () => true,
    })
    .put({ type: 'CANCELLED' })
    .run();
});

test('uses provided value for `cps`', () => {
  const handler = (cb) => cb(null, 1);
  const otherHandler = () => 0;

  function* saga() {
    const value = yield cps(handler);
    const otherValue = yield cps(otherHandler, 21);

    yield put({ type: 'DONE', payload: value + otherValue });
  }

  return expectSaga(saga)
    .provide({
      cps({ fn, args: [value] }, next) {
        if (fn === otherHandler) {
          return value * 2;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .run();
});

test('uses provided value for `flush`', () => {
  function* saga() {
    const channel = yield actionChannel('FOO');
    const value = yield flush(channel);

    yield put({ type: 'DONE', payload: value });
  }

  return expectSaga(saga)
    .provide({
      actionChannel: () => fakeChannel,

      flush(channel, next) {
        if (channel === fakeChannel) {
          return 'flushed';
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 'flushed' })
    .run();
});

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

test('uses provided value for `join`', () => {
  const fakeTask = createMockTask();

  function* backgroundSaga() {
    yield 42;
  }

  function* saga() {
    const task = yield fork(backgroundSaga);
    const value = yield join(task);

    yield put({ type: 'DONE', payload: value });
  }

  return expectSaga(saga)
    .provide({
      join(task, next) {
        if (task === fakeTask) {
          return 'hello';
        }

        return next();
      },

      fork({ fn }, next) {
        if (fn === backgroundSaga) {
          return fakeTask;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 'hello' })
    .run();
});

test('uses provided value for `put`', () => {
  function* saga() {
    const result = yield put({ type: 'HELLO' });
    yield put({ type: 'WORLD', payload: result });
  }

  return expectSaga(saga)
    .provide({
      put({ action }, next) {
        if (action.type === 'HELLO') {
          return 42;
        }

        return next();
      },
    })
    .put({ type: 'WORLD', payload: 42 })
    .run();
});

test('uses provided value for `put.resolve`', () => {
  function* saga() {
    const result = yield put.resolve({ type: 'HELLO' });
    yield put({ type: 'WORLD', payload: result });
  }

  return expectSaga(saga)
    .provide({
      put({ resolve, action }, next) {
        if (resolve && action.type === 'HELLO') {
          return 42;
        }

        return next();
      },
    })
    .put({ type: 'WORLD', payload: 42 })
    .run();
});

test('uses provided value for `race`', () => {
  function* saga() {
    const { first, second } = yield race({
      first: take('FIRST'),
      second: take('SECOND'),
    });

    const { payload } = first || second;

    yield put({ payload, type: 'DONE' });
  }

  const promise1 = expectSaga(saga)
    .provide({
      race: () => ({
        first: {
          type: 'FIRST',
          payload: 42,
        },
      }),
    })
    .put({ type: 'DONE', payload: 42 })
    .run();

  const promise2 = expectSaga(saga)
    .provide({
      race: () => ({
        second: {
          type: 'SECOND',
          payload: 'hello',
        },
      }),
    })
    .put({ type: 'DONE', payload: 'hello' })
    .run();

  return Promise.all([
    promise1,
    promise2,
  ]);
});

test('inner providers for `race` work', () => {
  const fetchUser = () => delay(1000).then(() => fakeUser);

  function* saga() {
    const action = yield take('REQUEST_USER');
    const id = action.payload;

    const { user } = yield race({
      user: call(fetchUser, id),
      timeout: call(delay, 500),
    });

    if (user) {
      yield put({ type: 'RECEIVE_USER', payload: user });
    } else {
      yield put({ type: 'TIMEOUT' });
    }
  }

  const promise1 = expectSaga(saga)
    .provide({
      call({ fn }, next) {
        if (fn === fetchUser) {
          return fakeUser;
        }

        return next();
      },
    })
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .dispatch({ type: 'REQUEST_USER' })
    .run();

  const promise2 = expectSaga(saga)
    .provide({
      call({ fn }, next) {
        if (fn === delay) {
          return undefined;
        }

        return next();
      },
    })
    .put({ type: 'TIMEOUT' })
    .dispatch({ type: 'REQUEST_USER' })
    .run();

  return Promise.all([
    promise1,
    promise2,
  ]);
});

test('uses provided value for `select`', () => {
  const getValue = () => 0;
  const getOtherValue = state => state.otherValue;

  function* saga() {
    const value = yield select(getValue);
    const otherValue = yield select(getOtherValue);

    yield put({ type: 'DONE', payload: value + otherValue });
  }

  return expectSaga(saga)
    .withState({ otherValue: 22 })
    .provide({
      select({ selector }, next) {
        if (selector === getValue) {
          return 20;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 42 })
    .run();
});

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

test('provides actions for `take`', () => {
  function* saga() {
    const action = yield take('HELLO');
    const otherAction = yield take('WORLD');
    const payload = action.payload + otherAction.payload;

    yield put({ payload, type: 'DONE' });
  }

  return expectSaga(saga)
    .provide({
      take({ pattern }, next) {
        if (pattern === 'HELLO') {
          return { type: 'HELLO', payload: 42 };
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run();
});

test('provides actions for `take.maybe`', () => {
  function* saga() {
    const action = yield take.maybe('HELLO');
    const otherAction = yield take.maybe('WORLD');
    const payload = action.payload + otherAction.payload;

    yield put({ payload, type: 'DONE' });
  }

  return expectSaga(saga)
    .provide({
      take({ maybe, pattern }, next) {
        if (maybe && pattern === 'HELLO') {
          return { type: 'HELLO', payload: 42 };
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'WORLD', payload: 1 })
    .run();
});

test('uses provided value for `parallel`', () => {
  const apiFunction = () => 0;

  function* saga() {
    const [x, { payload: y }] = yield [
      call(apiFunction),
      take('Y'),
    ];

    yield put({ type: 'DONE', payload: x + y });
  }

  return expectSaga(saga)
    .provide({
      parallel: () => [
        20,
        { type: 'Y', payload: 22 },
      ],
    })
    .put({ type: 'DONE', payload: 42 })
    .run();
});

test('inner providers for `parallel` work', () => {
  const apiFunction = () => 0;

  function* saga() {
    const [x, { payload: y }] = yield [
      call(apiFunction),
      take('Y'),
    ];

    yield put({ type: 'DONE', payload: x + y });
  }

  return expectSaga(saga)
    .provide({
      call: () => 20,
      take: () => ({ type: 'Y', payload: 22 }),
    })
    .put({ type: 'DONE', payload: 42 })
    .run();
});

test('test coverage for PARALLEL handler', () => {
  const actual = handlers[PARALLEL]({}, {});
  expect(actual).toBe(NO_FAKE_VALUE);
});

test('handles errors', () => {
  const errorFunction = () => 0;
  const error = new Error('Whoops...');

  function* saga() {
    try {
      yield call(errorFunction);
    } catch (e) {
      yield put({ type: 'DONE', payload: e });
    }
  }

  return expectSaga(saga)
    .provide({
      call({ fn }) {
        if (fn === errorFunction) {
          throw error;
        }
      },
    })
    .put({ type: 'DONE', payload: error })
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

test('assert on effects with provided values', () => {
  const fetchUser = () => 0;
  const getDog = () => 0;
  const fakeTask = createMockTask();

  const fakeDog = {
    name: 'Tucker',
    age: 11,
  };

  function* otherSaga() {
    yield 'hello';
  }

  function* saga(id) {
    const user = yield call(fetchUser, id);
    const dog = yield select(getDog);
    const task = yield fork(otherSaga, 'fork arg');

    yield put({
      type: 'DONE',
      payload: { user, dog, task },
    });
  }

  return expectSaga(saga, 1)
    .provide({
      call: () => fakeUser,
      select: () => fakeDog,
      fork: () => fakeTask,
    })
    .call(fetchUser, 1)
    .select(getDog)
    .fork(otherSaga, 'fork arg')
    .put({
      type: 'DONE',
      payload: {
        user: fakeUser,
        dog: fakeDog,
        task: fakeTask,
      },
    })
    .run();
});

test('test coverage for FORK handler', () => {
  const actual = handlers[FORK]({}, {});
  expect(actual).toBe(NO_FAKE_VALUE);
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
