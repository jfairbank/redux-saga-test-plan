// @flow
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

import type {
  Api,
  ApiWithEffectsTesters,
  Arg,
  EffectTesterCreator,
  EffectTestersCreator,
  SavePoints,
} from './types';

const identity = value => value;

const ARGUMENT = 'ARGUMENT';
const ERROR = 'ERROR';
const NONE = 'NONE';
const FINISH = 'FINISH';
const FINISH_ARGUMENT = 'FINISH_ARGUMENT';

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
  const api = { next, back, finish, restart, save, restore, throw: throwError };

  const savePoints: SavePoints = {};
  let history: Array<Arg> = [];
  let finalSagaArgs = sagaArgs;
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
        throw new SagaTestError('saga not done');
      }

      return api;
    },

    is: (value) => (arg) => {
      if (!isEqual(arg, value)) {
        const errorMessage = createErrorMessage(
          'yielded values do not match',
          value,
          arg
        );

        throw new SagaTestError(errorMessage);
      }

      return api;
    },

    returns: (value, done) => (arg) => {
      if (!done) {
        throw new SagaTestError('saga not done');
      }

      if (!isEqual(arg, value)) {
        const errorMessage = createErrorMessage(
          'returned values do not match',
          value,
          arg
        );

        throw new SagaTestError(errorMessage);
      }

      return api;
    },
  };

  function createIterator(): Generator<*, *, *> {
    return saga(...finalSagaArgs);
  }

  function apiWithEffectsTesters(
    { value, done }: IteratorResult<*, *>
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
      returns: effectsTestersCreators.returns(value, done),
    };
  }

  function restart(...args: Array<any>): Api {
    if (args.length > 0) {
      finalSagaArgs = args;
    }

    history = [];
    iterator = createIterator();

    return api;
  }

  function next(...args: Array<any>): ApiWithEffectsTesters {
    const arg = args[0];
    let result;

    if (args.length === 0) {
      history.push({ type: NONE });
      result = iterator.next();
    } else {
      history.push({ type: ARGUMENT, value: arg });
      result = iterator.next(arg);
    }

    return apiWithEffectsTesters(result);
  }

  function finish(...args: Array<any>): ApiWithEffectsTesters {
    const arg = args[0];
    let result;

    if (args.length === 0) {
      history.push({ type: FINISH });
      result = iterator.return();
    } else {
      history.push({ type: FINISH_ARGUMENT, value: arg });
      result = iterator.return(arg);
    }

    return apiWithEffectsTesters(result);
  }

  function throwError(error: Error): ApiWithEffectsTesters {
    history.push({ type: ERROR, value: error });

    const result = iterator.throw(error);

    return apiWithEffectsTesters(result);
  }

  function restore(name: string): Api {
    if (!savePoints[name]) {
      throw new Error(`No such save point ${name}`);
    }

    iterator = createIterator();
    history = savePoints[name];
    return applyHistory();
  }

  function back(n: number = 1): Api {
    if (n > history.length) {
      throw new Error('Cannot go back any further');
    }

    let m = n;

    while (m--) {
      history.pop();
    }

    iterator = createIterator();

    return applyHistory();
  }

  function save(name: string): Api {
    savePoints[name] = history.slice(0);
    return api;
  }

  function applyHistory(): Api {
    for (let i = 0, l = history.length; i < l; i++) {
      const arg = history[i];

      switch (arg.type) {
        case NONE:
          iterator.next();
          break;

        case ARGUMENT:
          iterator.next(arg.value);
          break;

        case ERROR:
          iterator.throw(arg.value);
          break;

        case FINISH:
          iterator.return();
          break;

        case FINISH_ARGUMENT:
          iterator.return(arg.value);
          break;

        // no default
      }
    }

    return api;
  }

  return api;
}

export { testSaga };
