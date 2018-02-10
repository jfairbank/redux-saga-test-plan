// @flow
import isEqual from 'lodash.isequal';
import createErrorMessage from './createErrorMessage';
import { TAKE, FORK } from '../shared/keys';
import getFunctionName from './getFunctionName';
import serializeTakePattern from './serializeTakePattern';

export default function validateTakeHelper(
  effectName: string,
  actual: TakeHelperGenerator,
  expected: TakeHelperGenerator,
  stepNumber: number,
): ?string {
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
      `expected ${effectName} to watch pattern ${serializeTakePattern(
        expectedTakePattern,
      )}`,
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
    return createErrorMessage(`actual ${effectName} did not fork`, stepNumber);
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
