import { is } from 'redux-saga/utils';
import { cancel, cancelled, fork, put } from 'redux-saga/effects';
import expectSaga from 'expectSaga';

test('canceling one task', () => {
  function* backgroundSaga() {
    try {
      yield put({ type: 'RUNNING' });
    } finally {
      if (yield cancelled()) {
        yield put({ type: 'PARENT_CANCELLED' });
      }
    }
  }

  function* saga() {
    const task = yield fork(backgroundSaga);
    yield cancel(task);
  }

  const cancelSpy = jest.fn((task, next) => {
    expect(is.task(task)).toBe(true);
    expect(task.name).toBe('backgroundSaga');
    return next();
  });

  return expectSaga(saga)
    .provide({ cancel: cancelSpy })
    .put({ type: 'PARENT_CANCELLED' })
    .run();
});

test('canceling multiple tasks', () => {
  function* backgroundOneSaga() {
    try {
      yield put({ type: 'RUNNING_1' });
    } finally {
      if (yield cancelled()) {
        yield put({ type: 'CANCEL_1' });
      }
    }
  }

  function* backgroundTwoSaga() {
    try {
      yield put({ type: 'RUNNING_2' });
    } finally {
      if (yield cancelled()) {
        yield put({ type: 'CANCEL_2' });
      }
    }
  }

  function* saga() {
    const task1 = yield fork(backgroundOneSaga);
    const task2 = yield fork(backgroundTwoSaga);

    yield cancel(task1, task2);
  }

  const cancelSpy = jest
    .fn()
    .mockImplementationOnce((task, next) => {
      expect(is.task(task)).toBe(true);
      expect(task.name).toBe('backgroundOneSaga');
      return next();
    })
    .mockImplementationOnce((task, next) => {
      expect(is.task(task)).toBe(true);
      expect(task.name).toBe('backgroundTwoSaga');
      return next();
    });

  return expectSaga(saga)
    .provide({ cancel: cancelSpy })
    .put({ type: 'CANCEL_1' })
    .put({ type: 'CANCEL_2' })
    .run();
});

test('self cancellation', () => {
  function* backgroundSaga() {
    try {
      yield cancel();
    } finally {
      if (yield cancelled()) {
        yield put({ type: 'SELF_CANCELLED' });
      }
    }
  }

  function* saga() {
    yield fork(backgroundSaga);
  }

  return expectSaga(saga)
    .put({ type: 'SELF_CANCELLED' })
    .run();
});
