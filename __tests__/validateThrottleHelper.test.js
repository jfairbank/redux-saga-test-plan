// @flow
import { delay, eventChannel } from 'redux-saga';
import { actionChannel, call, fork, take } from 'redux-saga/effects';
import validateThrottleHelper, {
  fakeChannelCreator,
} from '../src/testSaga/validateThrottleHelper';

function* yieldNullActionChannel() {
  yield null;
}

function* yieldActionChannel() {
  yield actionChannel('FOO');
}

function* yieldNullFork() {
  const channel = yield actionChannel('FOO');
  yield take(channel);
  yield null;
}

function* yieldFork() {
  const channel = yield actionChannel('FOO');
  yield take(channel);
  yield fork(yieldActionChannel);
}

function* yieldNullCall() {
  const channel = yield actionChannel('FOO');
  yield take(channel);
  yield fork(yieldActionChannel);
  yield null;
}

function* yieldCall() {
  const channel = yield actionChannel('FOO');
  yield take(channel);
  yield fork(yieldActionChannel);
  yield call(delay);
}

test('returns error message for null/undefined expected actionChannel', () => {
  const result = validateThrottleHelper(
    eventChannel,
    'throttle',
    yieldNullActionChannel(),
    yieldNullActionChannel(),
    1,
  );

  expect(result).toMatch(/expected throttle did not request an action channel/);
});

test('returns error message for null/undefined actual actionChannel', () => {
  const result = validateThrottleHelper(
    eventChannel,
    'throttle',
    yieldNullActionChannel(),
    yieldActionChannel(),
    1,
  );

  expect(result).toMatch(/actual throttle did not request an action channel/);
});

test('returns error message for null/undefined expected fork', () => {
  const result = validateThrottleHelper(
    eventChannel,
    'throttle',
    yieldNullFork(),
    yieldNullFork(),
    1,
  );

  expect(result).toMatch(/expected throttle did not fork/);
});

test('returns error message for null/undefined actual fork', () => {
  const result = validateThrottleHelper(
    eventChannel,
    'throttle',
    yieldNullFork(),
    yieldFork(),
    1,
  );

  expect(result).toMatch(/actual throttle did not fork/);
});

test('returns error message for null/undefined expected call', () => {
  const result = validateThrottleHelper(
    eventChannel,
    'throttle',
    yieldNullCall(),
    yieldNullCall(),
    1,
  );

  expect(result).toMatch(/expected throttle did not call delay/);
});

test('returns error message for null/undefined actual call', () => {
  const result = validateThrottleHelper(
    eventChannel,
    'throttle',
    yieldNullCall(),
    yieldCall(),
    1,
  );

  expect(result).toMatch(/actual throttle did not call delay/);
});

// Code coverage
fakeChannelCreator()();
