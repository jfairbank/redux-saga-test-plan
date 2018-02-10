// @flow
import isEqual from 'lodash.isequal';
import createErrorMessage from './createErrorMessage';
import validateHelperNamesMatch from './validateHelperNamesMatch';
import validateTakeHelper from './validateTakeHelper';
import validateThrottleHelper from './validateThrottleHelper';
import isHelper from './isHelper';

export default function validateEffects(
  eventChannel: Function,
  effectName: string,
  effectKey: ?string,
  isHelperEffect: boolean,
  actual: ?Object | ?Array<Object>,
  expected: Object | Array<Object>,
  stepNumber: number,
): ?string {
  const expectedIsHelper = isHelper(expected);
  const actualIsHelper = isHelper(actual);

  const finalEffectName = expectedIsHelper
    ? `${effectName} helper`
    : effectName;

  if (actual == null) {
    return createErrorMessage(
      `expected ${finalEffectName} effect, but the saga yielded nothing`,
      stepNumber,
      actual,
      expected,
      effectKey,
    );
  }

  if (
    !Array.isArray(actual) &&
    actualIsHelper &&
    !Array.isArray(expected) &&
    expectedIsHelper
  ) {
    const errorMessage = validateHelperNamesMatch(
      effectName,
      actual,
      stepNumber,
    );

    if (errorMessage) {
      return errorMessage;
    }

    if (effectName === 'throttle') {
      return validateThrottleHelper(
        eventChannel,
        effectName,
        actual,
        expected,
        stepNumber,
      );
    }

    return validateTakeHelper(effectName, actual, expected, stepNumber);
  }

  if (Array.isArray(actual) && !Array.isArray(expected)) {
    return createErrorMessage(
      `expected ${finalEffectName} effect, but the saga yielded parallel effects`,
      stepNumber,
      actual,
      expected,
      effectKey,
    );
  }

  if (!Array.isArray(actual) && Array.isArray(expected)) {
    return createErrorMessage(
      'expected parallel effects, but the saga yielded a single effect',
      stepNumber,
      actual,
      expected,
      effectKey,
    );
  }

  const bothEqual = isEqual(actual, expected);

  const effectsDifferent =
    (isHelperEffect && !bothEqual) ||
    (!isHelperEffect &&
      ((!Array.isArray(actual) && !actual[effectKey]) ||
        (!Array.isArray(expected) && !expected[effectKey])));

  if (effectsDifferent) {
    return createErrorMessage(
      `expected ${finalEffectName} effect, but the saga yielded a different effect`,
      stepNumber,
      actual,
      expected,
    );
  }

  if (!bothEqual) {
    return createErrorMessage(
      `${finalEffectName} effects do not match`,
      stepNumber,
      actual,
      expected,
      effectKey,
    );
  }

  return null;
}
