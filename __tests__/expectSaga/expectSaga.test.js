/* eslint-disable no-constant-condition */
import { take, takeEvery, fork, join, put, spawn } from 'redux-saga/effects';
import { warn } from '../../src/utils/logging';
import { delay } from '../../src/utils/async';
import { expectSaga } from '../../src';

jest.mock('../../src/utils/logging');

test('does not throw with non-effects', () => {
  function* saga() {
    yield 42;
  }

  return expectSaga(saga).run();
});

test('warns if times out with default timeout', async () => {
  warn.mockClear();

  function* saga() {
    while (true) {
      yield take('FOO');
    }
  }

  await expectSaga(saga).run();

  expect(warn).toHaveBeenCalledTimes(1);

  const [[actual]] = warn.mock.calls;
  const expected = `Saga exceeded async timeout of ${expectSaga.DEFAULT_TIMEOUT}ms`;

  expect(actual).toMatch(expected);
});

test('silences warnings', async () => {
  warn.mockClear();

  function* saga() {
    while (true) {
      yield take('FOO');
    }
  }

  await expectSaga(saga).run({ silenceTimeout: true });

  expect(warn).not.toHaveBeenCalled();
});

test('silences warnings with forks', async () => {
  warn.mockClear();

  function* otherSaga() {
    yield 42;
  }

  function* saga() {
    yield takeEvery('TAKE_EVERY', otherSaga);
  }

  await expectSaga(saga).run({ silenceTimeout: true });

  expect(warn).not.toHaveBeenCalled();
});

test('warns if times out with supplied timeout', async () => {
  warn.mockClear();

  const timeout = expectSaga.DEFAULT_TIMEOUT + 10;

  function* saga() {
    while (true) {
      yield take('FOO');
    }
  }

  await expectSaga(saga).run(timeout);

  expect(warn).toHaveBeenCalledTimes(1);

  const [[arg]] = warn.mock.calls;

  expect(arg).toMatch(`Saga exceeded async timeout of ${timeout}ms`);
});

test('silences warning if times out with supplied timeout', async () => {
  warn.mockClear();

  const timeout = expectSaga.DEFAULT_TIMEOUT + 10;

  function* saga() {
    while (true) {
      yield take('FOO');
    }
  }

  await expectSaga(saga).run({
    timeout,
    silenceTimeout: true,
  });

  expect(warn).not.toHaveBeenCalled();
});

test('waits for completion without timeout', async () => {
  warn.mockClear();

  function* saga() {
    yield delay(expectSaga.DEFAULT_TIMEOUT + 10);
    yield 42;
  }

  await expectSaga(saga).run(false);

  expect(warn).not.toHaveBeenCalled();
});

test('waits on promises with sufficient timeout period', async () => {
  warn.mockClear();

  function* saga() {
    yield delay(200);
  }

  await expectSaga(saga).run(300);

  expect(warn).not.toHaveBeenCalled();
});

test('waits for promises that were added later on', async () => {
  warn.mockClear();

  const mock = jest.fn();
  function* saga() {
    yield delay(50);
    yield spawn(function* fork1() {
      yield delay(100);
      mock();
    });
  }

  await expectSaga(saga).run(200);
  expect(mock).toHaveBeenCalled();
});

test('doesn\'t extend timeout period when new promises are added', async () => {
  warn.mockClear();

  const mock = jest.fn();
  function* saga() {
    yield delay(100);
    yield spawn(function* fork1() {
      yield delay(150);
      mock();
    });
  }

  await expectSaga(saga).run(200);
  expect(mock).not.toHaveBeenCalled();
});

test('times out if promise doesn\'t resolve in time', async () => {
  warn.mockClear();

  function* saga() {
    yield delay(300);
  }

  await expectSaga(saga).run(200);

  expect(warn).toHaveBeenCalledTimes(1);

  const [[arg]] = warn.mock.calls;

  expect(arg).toMatch('Saga exceeded async timeout of 200ms');
});

test('times out even if promises keep getting added', async () => {
  warn.mockClear();

  function* saga() {
    while (true) {
      yield put({ type: 'FOO' });
      yield delay(100);
    }
  }

  function* otherSaga() {
    yield takeEvery('FOO', function* handler() {
      yield 42;
    });
  }

  function* sagas() {
    yield [
      fork(saga),
      fork(otherSaga),
    ];
  }

  const promise = Promise.race([
    expectSaga(sagas).run(200).then(() => false),
    delay(250).then(() => true),
  ]);

  const timedOut = await promise;

  expect(timedOut).toBe(false);

  expect(warn).toHaveBeenCalledTimes(1);
});

// Mainly for test coverage
test('ignores effects without effect store', () => {
  function* backgroundSaga() {
    yield put({ type: 'BACKGROUND' });
  }

  function* saga() {
    const task = yield fork(backgroundSaga);
    yield join(task);
    yield put({ type: 'DONE' });
  }

  return expectSaga(saga)
    .put({ type: 'DONE' })
    .run();
});
