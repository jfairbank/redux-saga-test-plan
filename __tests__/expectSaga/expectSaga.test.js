/* eslint-disable no-constant-condition */
import { take } from 'redux-saga/effects';
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
