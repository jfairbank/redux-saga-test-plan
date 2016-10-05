// @flow
import { HELPER } from './keys';

export default function isHelper(generator: mixed): boolean {
  return (
    typeof generator === 'object' &&
    generator != null &&
    HELPER in generator
  );
}
