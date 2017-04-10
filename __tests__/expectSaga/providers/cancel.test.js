// @flow
import { cancel, fork, put } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import { expectSaga } from '../../../src';

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
