// @flow
import SagaTestError from './SagaTestError';
import validateEffects from './validateEffects';

export default function assertSameEffect(
  effectName: string,
  effectKey: ?string,
  actual: Object,
  expected: Object,
  stepNumber: number,
) {
  const errorMessage = validateEffects(
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
