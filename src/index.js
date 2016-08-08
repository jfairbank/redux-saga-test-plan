/* @flow */
import type {
  Api,
  ApiWithEffectsTesters,
  EffectTesterCreator,
  EffectTestersCreator,
  Arg,
} from './types';

import isEqual from 'lodash.isequal';
import inspect from 'util-inspect';

import {
  take,
  takem,
  put,
  race,
  call,
  apply,
  cps,
  fork,
  spawn,
  join,
  cancel,
  select,
  actionChannel,
  cancelled,
} from 'redux-saga/effects';

const identity = value => value;

const ARGUMENT = 'ARGUMENT';
const ERROR = 'ERROR';
const NONE = 'NONE';

class SagaTestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SagaTestError';
  }
}

function serializeEffect(
  effect: Object | Array<Object>,
  effectKey: ?string
): string {
  if (!effect || Array.isArray(effect) || !effectKey || !effect[effectKey]) {
    return inspect(effect, { depth: 3 });
  }

  return inspect(effect[effectKey], { depth: 3 });
}

function createErrorMessage(
  header: string,
  actual: Object | Array<Object>,
  expected: Object | Array<Object>,
  effectKey?: ?string
): string {
  const serializedExpected = serializeEffect(expected, effectKey);
  const serializedActual = serializeEffect(actual, effectKey);

  const errorMessage = `\n${header}\n\n`
                     + `Expected\n--------\n${serializedExpected}\n\n`
                     + `Actual\n------\n${serializedActual}\n`;

  return errorMessage;
}

function validateEffects(
  effectName: string,
  effectKey: ?string,
  actual: Object | Array<Object>,
  expected: Object | Array<Object>
): ?string {
  if (actual == null) {
    return createErrorMessage(
      `Expected ${effectName} effect, but the saga yielded nothing`,
      actual,
      expected,
      effectKey
    );
  }

  if (Array.isArray(actual) && !Array.isArray(expected)) {
    return createErrorMessage(
      `Expected ${effectName} effect, but the saga yielded parallel effects`,
      actual,
      expected,
      effectKey
    );
  }

  if (!Array.isArray(actual) && Array.isArray(expected)) {
    return createErrorMessage(
      'Expected parallel effects, but the saga yielded a single effect',
      actual,
      expected,
      effectKey
    );
  }

  if (
    (!Array.isArray(actual) && !actual[effectKey]) ||
    (!Array.isArray(expected) && !expected[effectKey])
  ) {
    return createErrorMessage(
      `Expected ${effectName} effect, but the saga yielded a different effect`,
      actual,
      expected
    );
  }

  if (!isEqual(actual, expected)) {
    return createErrorMessage(
      `${effectName} effects do not match`,
      actual,
      expected,
      effectKey
    );
  }

  return null;
}

function assertSameEffect(
  effectName: string,
  effectKey: ?string,
  actual: Object,
  expected: Object
): void {
  const errorMessage = validateEffects(
    effectName,
    effectKey,
    actual,
    expected
  );

  if (errorMessage) {
    throw new SagaTestError(errorMessage);
  }
}

export default function testSaga(
  saga: Function,
  ...sagaArgs: Array<any>
): Api {
  const api = { next, back, restart, throw: throwError };

  let previousArgs: Array<Arg> = [];
  let iterator = createIterator();

  function createEffectTester(
    name: string,
    key?: string,
    effect: Function = identity
  ): EffectTesterCreator {
    return (yieldedValue) => (...args) => {
      assertSameEffect(name, key, yieldedValue, effect(...args));
      return api;
    };
  }

  const effectsTestersCreators: EffectTestersCreator = {
    actionChannel: createEffectTester('actionChannel', 'ACTION_CHANNEL', actionChannel),
    apply: createEffectTester('apply', 'CALL', apply),
    call: createEffectTester('call', 'CALL', call),
    cancel: createEffectTester('cancel', 'CANCEL', cancel),
    cancelled: createEffectTester('cancelled', 'CANCELLED', cancelled),
    cps: createEffectTester('cps', 'CPS', cps),
    fork: createEffectTester('fork', 'FORK', fork),
    join: createEffectTester('join', 'JOIN', join),
    parallel: createEffectTester('parallel'),
    put: createEffectTester('put', 'PUT', put),
    race: createEffectTester('race', 'RACE', race),
    select: createEffectTester('select', 'SELECT', select),
    spawn: createEffectTester('spawn', 'FORK', spawn),
    take: createEffectTester('take', 'TAKE', take),
    takem: createEffectTester('takem', 'TAKE', takem),

    isDone: (done) => () => {
      if (!done) {
        throw new Error('saga not done');
      }

      return api;
    },

    is: (value) => (arg) => {
      if (!isEqual(arg, value)) {
        throw new Error('yielded values do not match');
      }

      return api;
    },
  };

  function createIterator(): Generator {
    return saga(...sagaArgs);
  }

  function apiWithEffectsTesters(
    { value, done }: IteratorResult
  ): ApiWithEffectsTesters {
    return {
      ...api,
      actionChannel: effectsTestersCreators.actionChannel(value),
      apply: effectsTestersCreators.apply(value),
      call: effectsTestersCreators.call(value),
      cancel: effectsTestersCreators.cancel(value),
      cancelled: effectsTestersCreators.cancelled(value),
      cps: effectsTestersCreators.cps(value),
      fork: effectsTestersCreators.fork(value),
      join: effectsTestersCreators.join(value),
      parallel: effectsTestersCreators.parallel(value),
      put: effectsTestersCreators.put(value),
      race: effectsTestersCreators.race(value),
      select: effectsTestersCreators.select(value),
      spawn: effectsTestersCreators.spawn(value),
      take: effectsTestersCreators.take(value),
      takem: effectsTestersCreators.takem(value),
      is: effectsTestersCreators.is(value),
      isDone: effectsTestersCreators.isDone(done),
    };
  }

  function restart(): Api {
    previousArgs = [];
    iterator = createIterator();

    return api;
  }

  function next(...args: Array<any>): ApiWithEffectsTesters {
    const arg = args[0];
    let result;

    if (args.length === 0) {
      previousArgs.push({ type: NONE });
      result = iterator.next();
    } else {
      previousArgs.push({ type: ARGUMENT, value: arg });
      result = iterator.next(arg);
    }

    return apiWithEffectsTesters(result);
  }

  function throwError(error: Error): ApiWithEffectsTesters {
    previousArgs.push({ type: ERROR, value: error });

    const result = iterator.throw(error);

    return apiWithEffectsTesters(result);
  }

  function back(n: number = 1): Api {
    if (n > previousArgs.length) {
      throw new Error('Cannot go back any further');
    }

    let m = n;

    while (m--) {
      previousArgs.pop();
    }

    iterator = createIterator();

    for (let i = 0, l = previousArgs.length; i < l; i++) {
      const arg = previousArgs[i];

      if (arg.type === NONE) {
        iterator.next();
      } else if (arg.type === ERROR) {
        iterator.throw(arg.value);
      } else {
        iterator.next(arg.value);
      }
    }

    return api;
  }

  return api;
}

export { testSaga };
