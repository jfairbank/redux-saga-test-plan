// @flow
import serializeEffect from './serializeEffect';

export default function createErrorMessage(
  header: string,
  stepNumber: number,
  actual: mixed | Array<mixed>,
  expected: mixed | Array<mixed>,
  effectKey?: ?string,
): string {
  const serializedExpected = serializeEffect(expected, effectKey);
  const serializedActual = serializeEffect(actual, effectKey);

  const errorMessage = `\nAssertion ${stepNumber} failed: ${header}\n\n`
                     + `Expected\n--------\n${serializedExpected}\n\n`
                     + `Actual\n------\n${serializedActual}\n`;

  return errorMessage;
}
