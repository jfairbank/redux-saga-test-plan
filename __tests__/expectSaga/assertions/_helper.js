// @flow
export const errorRegex = /expectation unmet/;

export function unreachableError() {
  throw new Error('Should not be reached');
}
