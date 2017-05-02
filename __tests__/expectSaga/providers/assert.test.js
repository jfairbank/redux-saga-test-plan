// @flow
import { call, fork, put, select } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import expectSaga from 'expectSaga';

const fakeUser = {
  id: 1,
  name: 'John Doe',
};

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

test('assert on effects that provide thrown error', () => {
  const fn = () => ({});
  const error = new Error('error');

  function* saga() {
    try {
      yield call(fn);
    } catch (e) {
      yield put({ type: 'ERROR', error: e });
    }
  }

  return expectSaga(saga)
    .provide({
      call() { throw error; },
    })
    .call(fn)
    .run();
});
