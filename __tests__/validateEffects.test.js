// @flow
import { eventChannel } from 'redux-saga';
import { call } from 'redux-saga/effects';
import { CALL } from 'shared/keys';
import validateEffects from 'testSaga/validateEffects';

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
