// @flow
import { cancel, fork, put } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import { expectSaga } from '../../../src';
import * as m from '../../../src/expectSaga/matchers';

function* backgroundSaga() {
  yield 42;
}

function* saga() {
  const task = yield fork(backgroundSaga);
  const value = yield cancel(task);

  yield put({ type: 'DONE', payload: value });
}

const forkProvider = task => ({ fork: () => task });

test('uses provided value for `cancel`', () => {
  const fakeTask = createMockTask();

  return expectSaga(saga)
    .provide({
      cancel(task, next) {
        if (task === fakeTask) {
          return 'cancelled';
        }

        return next();
      },

      fork: forkProvider(fakeTask).fork,
    })
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('uses static provided values from redux-saga/effects', () => {
  const fakeTask = createMockTask();

  return expectSaga(saga)
    .provide([
      [cancel(fakeTask), 'cancelled'],
      forkProvider(fakeTask),
    ])
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('uses static provided values from matchers', () => {
  const fakeTask = createMockTask();

  return expectSaga(saga)
    .provide([
      [m.cancel(fakeTask), 'cancelled'],
      forkProvider(fakeTask),
    ])
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});
