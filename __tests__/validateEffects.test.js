// @flow
import { eventChannel } from 'redux-saga';
import { call } from 'redux-saga/effects';
import { CALL } from '../src/keys';
import validateEffects from '../src/validateEffects';

const identity = value => value;

test('returns error message for missing actual value', () => {
  const result = validateEffects(
    eventChannel,
    'call',
    CALL,
    false,
    null,
    call(identity),
    1,
  );

  expect(result).toMatch(/expected call effect, but the saga yielded nothing/);
});

test('returns error message if expected parallel but actual is not array', () => {
  const result = validateEffects(
    eventChannel,
    'parallel',
    undefined,
    false,
    call(identity),
    [call(identity)],
    1,
  );

  expect(result).toMatch(/expected parallel effects, but the saga yielded a single effect/);
});
