// @flow
import { fork, join, put } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import { expectSaga } from '../../../src';
import * as m from '../../../src/expectSaga/matchers';

function* backgroundSaga() {
  yield 42;
}

function* saga() {
  const task = yield fork(backgroundSaga);
  const value = yield join(task);

  yield put({ type: 'DONE', payload: value });
}

const forkProvider = task => ({
  fork: ({ fn }, next) => (
    fn === backgroundSaga ? task : next()
  ),
});

test('uses provided value for `join`', () => {
  const fakeTask = createMockTask();

  return expectSaga(saga)
    .provide({
      join(task, next) {
        if (task === fakeTask) {
          return 'hello';
        }

        return next();
      },

      fork: forkProvider(fakeTask).fork,
    })
    .put({ type: 'DONE', payload: 'hello' })
    .run();
});

test('uses static provided values from redux-saga/effects', () => {
  const fakeTask = createMockTask();

  return expectSaga(saga)
    .provide([
      [join(fakeTask), 'hello'],
      forkProvider(fakeTask),
    ])
    .put({ type: 'DONE', payload: 'hello' })
    .run();
});

test('uses static provided values from matchers', () => {
  const fakeTask = createMockTask();

  return expectSaga(saga)
    .provide([
      [m.join(fakeTask), 'hello'],
      forkProvider(fakeTask),
    ])
    .put({ type: 'DONE', payload: 'hello' })
    .run();
});
