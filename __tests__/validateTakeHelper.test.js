// @flow
import { fork, take } from 'redux-saga/effects';
import validateTakeHelper from 'testSaga/validateTakeHelper';

function* yieldNullTake() {
  yield null;
}

function* yieldTake() {
  yield take('FOO');
}

function* yieldNullFork() {
  yield take('FOO');
  yield null;
}

function* yieldFork() {
  yield take('FOO');
  yield fork(yieldTake);
}

test('returns error message for null/undefined expected take', () => {
  const result = validateTakeHelper(
    'takeEvery',
    yieldNullTake(),
    yieldNullTake(),
    1,
  );

  expect(result).toMatch(/expected takeEvery did not take a pattern/);
});

test('returns error message for null/undefined actual take', () => {
  const result = validateTakeHelper(
    'takeEvery',
    yieldNullTake(),
    yieldTake(),
    1,
  );

  expect(result).toMatch(/actual takeEvery did not take a pattern/);
});

test('returns error message for null/undefined expected fork', () => {
  const result = validateTakeHelper(
    'takeEvery',
    yieldNullFork(),
    yieldNullFork(),
    1,
  );

  expect(result).toMatch(/expected takeEvery did not fork/);
});

test('returns error message for null/undefined actual fork', () => {
  const result = validateTakeHelper(
    'takeEvery',
    yieldNullFork(),
    yieldFork(),
    1,
  );

  expect(result).toMatch(/actual takeEvery did not fork/);
});
