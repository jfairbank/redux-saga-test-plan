// @flow
import isEqual from 'lodash.isequal';
import createErrorMessage from './createErrorMessage';
import serializeTakePattern from './serializeTakePattern';
import getFunctionName from './getFunctionName';
import { ACTION_CHANNEL, CALL, FORK } from '../shared/keys';

export const fakeChannelCreator = () => () => {};

export default function validateThrottleHelper(
  eventChannel: Function,
  effectName: string,
  actual: ThrottleHelperGenerator,
  expected: ThrottleHelperGenerator,
  stepNumber: number,
): ?string {
  const expectedActionChannel = expected.next().value;
  const actualActionChannel = actual.next().value;

  // null/undefined checks are primarily for flow typechecking
  if (expectedActionChannel == null) {
    return createErrorMessage(
      `expected ${effectName} did not request an action channel`,
      stepNumber,
    );
  }

  if (actualActionChannel == null) {
    return createErrorMessage(
      `actual ${effectName} did not request an action channel`,
      stepNumber,
    );
  }

  const expectedActionChannelPattern =
    expectedActionChannel[ACTION_CHANNEL].pattern;
  const actualActionChannelPattern =
    actualActionChannel[ACTION_CHANNEL].pattern;

  if (!isEqual(actualActionChannelPattern, expectedActionChannelPattern)) {
    return createErrorMessage(
      `expected ${effectName} to watch pattern ` +
        `${serializeTakePattern(expectedActionChannelPattern)}`,
      stepNumber,
      actualActionChannelPattern,
      expectedActionChannelPattern,
    );
  }

  // Consume the channel TAKE without checking it
  expected.next(eventChannel(fakeChannelCreator));
  actual.next(eventChannel(fakeChannelCreator));

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

  const expectedCall = expected.next().value;
  const actualCall = actual.next().value;

  if (expectedCall == null) {
    return createErrorMessage(
      `expected ${effectName} did not call delay`,
      stepNumber,
    );
  }

  if (actualCall == null) {
    return createErrorMessage(
      `actual ${effectName} did not call delay`,
      stepNumber,
    );
  }

  const [expectedDelay] = expectedCall[CALL].args;
  const [actualDelay] = actualCall[CALL].args;

  if (expectedDelay !== actualDelay) {
    return createErrorMessage(
      `expected ${effectName} to be delayed by ${expectedDelay} ms`,
      stepNumber,
      actualDelay,
      expectedDelay,
    );
  }

  return null;
}
