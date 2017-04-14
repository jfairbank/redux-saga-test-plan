import {
  fork,
  put,
  race,
  spawn,
} from 'redux-saga/effects';

import { expectSaga } from '../../src';

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

const createRaceSaga = effectCreator => function* saga() {
  const { saga: task } = yield race({ saga: effectCreator(regularBackgroundSaga) });
  return task.name;
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

test('wrapped sagas return a task with a name referring to the parallel spawned saga', () => {
  const saga = createParallelSaga(spawn);

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
