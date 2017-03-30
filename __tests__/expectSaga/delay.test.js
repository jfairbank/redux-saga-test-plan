import { put, take } from 'redux-saga/effects';
import { delay } from '../../src/utils/async';
import { expectSaga } from '../../src';

function* mainSaga(callback) {
  const before = process.hrtime();

  yield take('FOO');
  yield take('BAR');

  const after = process.hrtime();
  const elapsed = (((after[0] - before[0]) * 1e9) + (after[1] - before[1])) / 1e6;

  callback(elapsed);

  yield put({ type: 'DONE' });
}

it('can dispatch actions while running', async () => {
  const saga = expectSaga(mainSaga, () => {});

  saga.put({ type: 'DONE' });

  saga.dispatch({ type: 'FOO' });

  const promise = saga.run({ timeout: false });

  await delay(250);

  saga.dispatch({ type: 'BAR' });

  await promise;
});

it('can delay actions', () => {
  function callback(elapsed) {
    expect(elapsed).toBeGreaterThanOrEqual(240);
  }

  return expectSaga(mainSaga, callback)
    .put({ type: 'DONE' })
    .dispatch({ type: 'FOO' })
    .delay(250)
    .dispatch({ type: 'BAR' })
    .run({ timeout: false });
});

it('can delay multiple times', () => {
  function* saga(elapsedCallback) {
    yield take('FOO');

    const start = process.hrtime();

    yield take('BAR');
    yield take('BAZ');

    const end1 = process.hrtime();
    const elapsed1 = (((end1[0] - start[0]) * 1e9) + (end1[1] - start[1])) / 1e6;

    yield take('QUUX');

    const end2 = process.hrtime();
    const elapsed2 = (((end2[0] - end1[0]) * 1e9) + (end2[1] - end1[1])) / 1e6;

    elapsedCallback(elapsed1, elapsed2);

    yield put({ type: 'DONE' });
  }

  function callback(elapsed1, elapsed2) {
    expect(elapsed1).toBeGreaterThanOrEqual(90);
    expect(elapsed2).toBeGreaterThanOrEqual(140);
  }

  return expectSaga(saga, callback)
    .put({ type: 'DONE' })
    .dispatch({ type: 'FOO' })
    .delay(100)
    .dispatch({ type: 'BAR' })
    .dispatch({ type: 'BAZ' })
    .delay(150)
    .dispatch({ type: 'QUUX' })
    .run({ timeout: false });
});
