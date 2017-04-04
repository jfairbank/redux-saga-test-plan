// @flow
/* eslint-disable no-underscore-dangle */
import isEqualWith from 'lodash.isequalwith';

export default (value: any, other: any): boolean => isEqualWith(value, other, usesEqualityFunction);

function usesEqualityFunction(value: any, other: any): ?boolean {
  if (value && value.equals && typeof value.equals === 'function') return value.equals(other);
  return undefined;
}
