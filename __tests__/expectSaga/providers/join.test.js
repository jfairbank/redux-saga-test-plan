// @flow
import { fork, join, put } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import { expectSaga } from '../../../src';

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
