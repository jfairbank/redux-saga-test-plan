// @flow
import isEqual from 'lodash.isequal';
import createErrorMessage from './createErrorMessage';
import extractSagaHelperEffectName from './extractSagaHelperEffectName';
import { TAKE, FORK } from './keys';
import getFunctionName from './getFunctionName';

function serializePattern(
  pattern: string | Array<string> | Function
): string {
  if (Array.isArray(pattern)) {
    return `[${pattern.join(', ')}]`;
  }

  if (typeof pattern === 'function') {
    return getFunctionName(pattern);
  }

  return pattern;
}

export default function validateSagaHelperEffects(
  effectName: string,
  actual: SagaHelperGenerator,
  expected: SagaHelperGenerator,
  stepNumber: number,
): ?string {
  // Delegated helpers won't have a name property
  if (typeof actual.name === 'string') {
    const actualEffectName = extractSagaHelperEffectName(actual.name);

    if (actualEffectName !== effectName) {
      return createErrorMessage(
        `expected a ${effectName} helper effect, but the saga used a ` +
        `${actualEffectName} helper effect`,
        stepNumber,
        actualEffectName,
        effectName,
      );
    }
  }

  const expectedTake = expected.next().value;
  const actualTake = actual.next().value;

  // null/undefined checks are primarily for flow typechecking
  if (expectedTake == null) {
    return createErrorMessage(
      `expected ${effectName} did not take a pattern`,
      stepNumber,
    );
  }

  if (actualTake == null) {
    return createErrorMessage(
      `actual ${effectName} did not take a pattern`,
      stepNumber,
    );
  }

  const expectedTakePattern = expectedTake[TAKE].pattern;
  const actualTakePattern = actualTake[TAKE].pattern;

  if (!isEqual(actualTakePattern, expectedTakePattern)) {
    return createErrorMessage(
      `expected ${effectName} to watch pattern ${serializePattern(expectedTakePattern)}`,
      stepNumber,
      actualTakePattern,
      expectedTakePattern,
    );
  }

  const expectedFork = expected.next().value;
  const actualFork = actual.next().value;

  if (expectedFork == null) {
    return createErrorMessage(
      `expected ${effectName} did not fork`,
      stepNumber,
    );
  }

  if (actualFork == null) {
    return createErrorMessage(
      `actual ${effectName} did not fork`,
      stepNumber,
    );
  }

  const { fn: expectedForkFn, args: expectedForkArgs } = expectedFork[FORK];
  const { fn: actualForkFn, args: actualForkArgs } = actualFork[FORK];

  if (expectedForkFn !== actualForkFn) {
    const expectedForkFnName = getFunctionName(expectedForkFn);

    return createErrorMessage(
      `expected ${effectName} to fork ${expectedForkFnName}`,
      stepNumber,
      actualForkFn,
      expectedForkFn,
    );
  }

  if (!isEqual(expectedForkArgs, actualForkArgs)) {
    return createErrorMessage(
      `arguments to ${effectName} do not match`,
      stepNumber,
      actualForkArgs,
      expectedForkArgs,
    );
  }

  return null;
}
