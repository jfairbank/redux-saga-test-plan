// @flow
import inspect from 'util-inspect';
import isMatch from 'lodash.ismatch';
import isEqual from 'lodash.isequal';
import SagaTestError from '../shared/SagaTestError';
import type ArraySet from '../utils/ArraySet';
import serializeEffect from '../shared/serializeEffect';
import reportActualEffects from './reportActualEffects';

type ExpectationThunkArgs = {
  storeState: mixed,
  returnValue: mixed,
};

export type Expectation = ExpectationThunkArgs => void;

type EffectExpectationArgs = {
  effectName: string,
  expectedEffect: mixed,
  storeKey: string,
  like: boolean,
  extractEffect: Function,
  store: ArraySet<mixed>,
  expected: boolean,
};

export function createEffectExpectation({
  effectName,
  expectedEffect,
  storeKey,
  like,
  extractEffect,
  store,
  expected,
}: EffectExpectationArgs): Expectation {
  return () => {
    const deleted = like
      ? store.deleteBy(item => isMatch(extractEffect(item), expectedEffect))
      : store.delete(expectedEffect);

    let errorMessage = '';

    if (deleted && !expected) {
      const serializedEffect = serializeEffect(expectedEffect, storeKey);

      errorMessage =
        `\n${effectName} expectation unmet:` +
        `\n\nNot Expected\n------------\n${serializedEffect}\n`;
    } else if (!deleted && expected) {
      const serializedEffect = serializeEffect(expectedEffect, storeKey);

      errorMessage =
        `\n${effectName} expectation unmet:` +
        `\n\nExpected\n--------\n${serializedEffect}\n`;

      errorMessage += reportActualEffects(store, storeKey, effectName);
    }

    if (errorMessage) {
      throw new SagaTestError(errorMessage);
    }
  };
}

type ReturnExpectationArgs = {
  value: mixed,
  expected: boolean,
};

export function createReturnExpectation({
  value,
  expected,
}: ReturnExpectationArgs): Expectation {
  return ({ returnValue }: ExpectationThunkArgs) => {
    if (expected && !isEqual(value, returnValue)) {
      const serializedActual = inspect(returnValue, { depth: 3 });
      const serializedExpected = inspect(value, { depth: 3 });

      const errorMessage = `
Expected to return:
-------------------
${serializedExpected}

But returned instead:
---------------------
${serializedActual}
`;

      throw new SagaTestError(errorMessage);
    } else if (!expected && isEqual(value, returnValue)) {
      const serializedExpected = inspect(value, { depth: 3 });

      const errorMessage = `
Did not expect to return:
-------------------------
${serializedExpected}
`;

      throw new SagaTestError(errorMessage);
    }
  };
}

type StoreStateExpectationArgs = {
  state: mixed,
  expected: boolean,
};

export function createStoreStateExpectation({
  state: expectedState,
  expected,
}: StoreStateExpectationArgs): Expectation {
  return ({ storeState }: ExpectationThunkArgs) => {
    if (expected && !isEqual(expectedState, storeState)) {
      const serializedActual = inspect(storeState, { depth: 3 });
      const serializedExpected = inspect(expectedState, { depth: 3 });

      const errorMessage = `
Expected to have final store state:
-----------------------------------
${serializedExpected}

But instead had final store state:
----------------------------------
${serializedActual}
`;

      throw new SagaTestError(errorMessage);
    } else if (!expected && isEqual(expectedState, storeState)) {
      const serializedExpected = inspect(expectedState, { depth: 3 });

      const errorMessage = `
Expected to not have final store state:
---------------------------------------
${serializedExpected}
`;

      throw new SagaTestError(errorMessage);
    }
  };
}
