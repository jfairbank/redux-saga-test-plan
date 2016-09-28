// @flow
import inspect from 'util-inspect';

const DEFAULT_OPTIONS = { depth: 3 };

export default function serializeEffect(
  effect: mixed | Array<mixed>,
  effectKey: ?string,
): string {
  if (
    effect != null &&
    typeof effect === 'object' &&
    !Array.isArray(effect) &&
    effectKey &&
    effectKey in effect
  ) {
    return inspect(effect[effectKey], DEFAULT_OPTIONS);
  }

  return inspect(effect, DEFAULT_OPTIONS);
}
