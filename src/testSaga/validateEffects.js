// @flow
import isEqual from 'lodash.isequal';
import createErrorMessage from './createErrorMessage';

export default function validateEffects(
  eventChannel: Function,
  effectName: string,
  effectKey: ?string,
  isHelperEffect: boolean,
  actual: ?Object | ?Array<Object>,
  expected: Object | Array<Object>,
  stepNumber: number,
): ?string {
  if (actual == null) {
    return createErrorMessage(
      `expected ${effectName} effect, but the saga yielded nothing`,
      stepNumber,
      actual,
      expected,
      effectKey,
    );
  }

  if (Array.isArray(actual) && !Array.isArray(expected)) {
    return createErrorMessage(
      `expected ${effectName} effect, but the saga yielded parallel effects`,
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
      `expected ${effectName} effect, but the saga yielded a different effect`,
      stepNumber,
      actual,
      expected,
    );
  }

  if (!bothEqual) {
    return createErrorMessage(
      `${effectName} effects do not match`,
      stepNumber,
      actual,
      expected,
      effectKey,
    );
  }

  return null;
}
