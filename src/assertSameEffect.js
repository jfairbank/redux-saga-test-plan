// @flow
import SagaTestError from './SagaTestError';
import validateEffects from './validateEffects';

export default function assertSameEffect(
  eventChannel: Function,
  effectName: string,
  effectKey: ?string,
  actual: Object,
  expected: Object,
  stepNumber: number,
) {
  const errorMessage = validateEffects(
    eventChannel,
    effectName,
    effectKey,
    actual,
    expected,
    stepNumber,
  );

  if (errorMessage) {
    throw new SagaTestError(errorMessage);
  }
}
