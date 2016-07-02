/* @flow */
import type {
  Api,
  ApiWithEffectsTesters,
  EffectTesterCreator,
  EffectTestersCreator,
  Arg,
} from './types';

import isEqual from 'lodash.isequal';

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

export default function testSaga(
  saga: Function,
  ...sagaArgs: Array<any>
): Api {
  const api = { next, back, restart, throw: throwError };

  let previousArgs: Array<Arg> = [];
  let iterator = createIterator();

  function createEffectTester(
    name: string,
    effect: Function = identity
  ): EffectTesterCreator {
    const error = new Error(`${name} effects do not match`);

    return (value) => (...args) => {
      if (!isEqual(effect(...args), value)) {
        throw error;
      }

      return api;
    };
  }

  const effectsTestersCreators: EffectTestersCreator = {
    actionChannel: createEffectTester('actionChannel', actionChannel),
    apply: createEffectTester('apply', apply),
    call: createEffectTester('call', call),
    cancel: createEffectTester('cancel', cancel),
    cancelled: createEffectTester('cancelled', cancelled),
    cps: createEffectTester('cps', cps),
    fork: createEffectTester('fork', fork),
    join: createEffectTester('join', join),
    parallel: createEffectTester('parallel'),
    put: createEffectTester('put', put),
    race: createEffectTester('race', race),
    select: createEffectTester('select', select),
    spawn: createEffectTester('spawn', spawn),
    take: createEffectTester('take', take),
    takem: createEffectTester('takem', takem),

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

    yields: (value) => (fun) => {
      if (typeof fun !== 'function') {
        throw new Error('must pass a function to yields');
      }

      fun(value);

      return api
    }
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
      yields: effectsTestersCreators.yields(value),
      isDone: effectsTestersCreators.isDone(done)
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
