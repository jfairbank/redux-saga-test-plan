import {
  all,
  call,
  cancel,
  cancelled,
  fork,
  put,
  race,
  spawn,
  take,
} from 'redux-saga/effects';

import expectSaga from 'expectSaga';
import { delay } from 'utils/async';

function* regularBackgroundSaga() {
  yield put({ type: 'DONE' });
}

const createRegularSaga = effectCreator => function* saga() {
  const task = yield effectCreator(regularBackgroundSaga);
  return task.name;
};

const createParallelSaga = effectCreator => function* saga() {
  const [task] = yield [effectCreator(regularBackgroundSaga)];
  return task.name;
};

const createAllSaga = effectCreator => function* saga() {
  const [task] = yield all([effectCreator(regularBackgroundSaga)]);
  return task.name;
};

const createRaceSaga = effectCreator => function* saga() {
  const { saga: task } = yield race({ saga: effectCreator(regularBackgroundSaga) });
  return task.name;
};

function* cancelledBackgroundSaga() {
  try {
    yield take('WAIT');
  } finally {
    if (yield cancelled()) {
      yield put({ type: 'DONE', payload: 'cancelled' });
    } else {
      yield put({ type: 'DONE', payload: 'not cancelled' });
    }
  }
}

const createCancelSaga = effectCreator => function* saga() {
  const task = yield effectCreator(cancelledBackgroundSaga);
  yield call(delay, 50);
  yield cancel(task);
};

const createCancelParallelSaga = effectCreator => function* saga() {
  const [task] = yield [effectCreator(cancelledBackgroundSaga)];
  yield call(delay, 50);
  yield cancel(task);
};

const createCancelAllSaga = effectCreator => function* saga() {
  const [task] = yield all([effectCreator(cancelledBackgroundSaga)]);
  yield call(delay, 50);
  yield cancel(task);
};

const createCancelRaceSaga = effectCreator => function* saga() {
  const { saga: task } = yield race({ saga: effectCreator(cancelledBackgroundSaga) });
  yield call(delay, 50);
  yield cancel(task);
};

test('wrapped sagas return a task with a name referring to the forked saga', () => {
  const saga = createRegularSaga(fork);

  return expectSaga(saga)
    .returns('regularBackgroundSaga')
    .run();
});

test('wrapped sagas return a task with a name referring to the spawned saga', () => {
  const saga = createRegularSaga(spawn);

  return expectSaga(saga)
    .returns('regularBackgroundSaga')
    .run();
});

test('wrapped sagas return a task with a name referring to the parallel forked saga', () => {
  const saga = createParallelSaga(fork);

  return expectSaga(saga)
    .returns('regularBackgroundSaga')
    .run();
});

test('wrapped sagas return a task with a name referring to the `all` forked saga', () => {
  const saga = createAllSaga(fork);

  return expectSaga(saga)
    .returns('regularBackgroundSaga')
    .run();
});

test('wrapped sagas return a task with a name referring to the parallel spawned saga', () => {
  const saga = createParallelSaga(spawn);

  return expectSaga(saga)
    .returns('regularBackgroundSaga')
    .run();
});

test('wrapped sagas return a task with a name referring to the `all` spawned saga', () => {
  const saga = createAllSaga(spawn);

  return expectSaga(saga)
    .returns('regularBackgroundSaga')
    .run();
});

test('wrapped sagas return a task with a name referring to the race forked saga', () => {
  const saga = createRaceSaga(fork);

  return expectSaga(saga)
    .returns('regularBackgroundSaga')
    .run();
});

test('wrapped sagas return a task with a name referring to the race spawned saga', () => {
  const saga = createRaceSaga(spawn);

  return expectSaga(saga)
    .returns('regularBackgroundSaga')
    .run();
});

test('wrapped forked sagas can detect cancellation', () => {
  const saga = createCancelSaga(fork);

  return expectSaga(saga)
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('wrapped spawned sagas can detect cancellation', () => {
  const saga = createCancelSaga(spawn);

  return expectSaga(saga)
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('providers receive task with name referring to forked saga', () => {
  const saga = createCancelSaga(fork);

  return expectSaga(saga)
    .provide({
      cancel(task, next) {
        expect(task.name).toBe('cancelledBackgroundSaga');
        return next();
      },
    })
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('providers receive task with name referring to spawned saga', () => {
  const saga = createCancelSaga(spawn);

  return expectSaga(saga)
    .provide({
      cancel(task, next) {
        expect(task.name).toBe('cancelledBackgroundSaga');
        return next();
      },
    })
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('wrapped parallel forked sagas can detect cancellation', () => {
  const saga = createCancelParallelSaga(fork);

  return expectSaga(saga)
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('wrapped `all` forked sagas can detect cancellation', () => {
  const saga = createCancelAllSaga(fork);

  return expectSaga(saga)
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('wrapped parallel spawned sagas can detect cancellation', () => {
  const saga = createCancelParallelSaga(spawn);

  return expectSaga(saga)
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('wrapped `all` spawned sagas can detect cancellation', () => {
  const saga = createCancelAllSaga(spawn);

  return expectSaga(saga)
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('providers receive task with name referring to parallel forked saga', () => {
  const saga = createCancelParallelSaga(fork);

  return expectSaga(saga)
    .provide({
      cancel(task, next) {
        expect(task.name).toBe('cancelledBackgroundSaga');
        return next();
      },
    })
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('providers receive task with name referring to `all` forked saga', () => {
  const saga = createCancelAllSaga(fork);

  return expectSaga(saga)
    .provide({
      cancel(task, next) {
        expect(task.name).toBe('cancelledBackgroundSaga');
        return next();
      },
    })
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('providers receive task with name referring to parallel spawned saga', () => {
  const saga = createCancelParallelSaga(spawn);

  return expectSaga(saga)
    .provide({
      cancel(task, next) {
        expect(task.name).toBe('cancelledBackgroundSaga');
        return next();
      },
    })
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('providers receive task with name referring to `all` spawned saga', () => {
  const saga = createCancelAllSaga(spawn);

  return expectSaga(saga)
    .provide({
      cancel(task, next) {
        expect(task.name).toBe('cancelledBackgroundSaga');
        return next();
      },
    })
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('wrapped race forked sagas can detect cancellation', () => {
  const saga = createCancelRaceSaga(fork);

  return expectSaga(saga)
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('wrapped race spawned sagas can detect cancellation', () => {
  const saga = createCancelRaceSaga(spawn);

  return expectSaga(saga)
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('providers receive task with name referring to race forked saga', () => {
  const saga = createCancelRaceSaga(fork);

  return expectSaga(saga)
    .provide({
      cancel(task, next) {
        expect(task.name).toBe('cancelledBackgroundSaga');
        return next();
      },
    })
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});

test('providers receive task with name referring to race spawned saga', () => {
  const saga = createCancelRaceSaga(spawn);

  return expectSaga(saga)
    .provide({
      cancel(task, next) {
        expect(task.name).toBe('cancelledBackgroundSaga');
        return next();
      },
    })
    .put({ type: 'DONE', payload: 'cancelled' })
    .run();
});
