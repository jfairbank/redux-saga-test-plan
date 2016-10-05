// @flow
import isEqual from 'lodash.isequal';
import { is } from 'redux-saga/utils';
import createErrorMessage from './createErrorMessage';
import validateSagaHelperEffects from './validateSagaHelperEffects';

export default function validateEffects(
  effectName: string,
  effectKey: ?string,
  actual: Object | Array<Object>,
  expected: Object | Array<Object>,
  stepNumber: number,
): ?string {
  const expectedIsHelper = is.helper(expected);
  const actualIsHelper = is.helper(actual);

  const finalEffectName = expectedIsHelper
    ? `${effectName} helper`
    : effectName;

  if (actual == null) {
    return createErrorMessage(
      `expected ${finalEffectName} effect, but the saga yielded nothing`,
      stepNumber,
      actual,
      expected,
      effectKey
    );
  }

  if (
    !Array.isArray(actual) &&
    actualIsHelper &&
    !Array.isArray(expected) &&
    expectedIsHelper
  ) {
    return validateSagaHelperEffects(
      effectName,
      actual,
      expected,
      stepNumber,
    );
  }

  if (Array.isArray(actual) && !Array.isArray(expected)) {
    return createErrorMessage(
      `expected ${finalEffectName} effect, but the saga yielded parallel effects`,
      stepNumber,
      actual,
      expected,
      effectKey
    );
  }

  if (!Array.isArray(actual) && Array.isArray(expected)) {
    return createErrorMessage(
      'expected parallel effects, but the saga yielded a single effect',
      stepNumber,
      actual,
      expected,
      effectKey
    );
  }

  if (
    (!Array.isArray(actual) && !actual[effectKey]) ||
    (!Array.isArray(expected) && !expected[effectKey])
  ) {
    return createErrorMessage(
      `expected ${finalEffectName} effect, but the saga yielded a different effect`,
      stepNumber,
      actual,
      expected
    );
  }

  if (!isEqual(actual, expected)) {
    return createErrorMessage(
      `${finalEffectName} effects do not match`,
      stepNumber,
      actual,
      expected,
      effectKey
    );
  }

  return null;
}
