// @flow
import createErrorMessage from './createErrorMessage';
import extractSagaHelperEffectName from './extractSagaHelperEffectName';

export default function validateHelperNamesMatch(
  effectName: string,
  actual: TakeHelperGenerator | ThrottleHelperGenerator,
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

  return null;
}
