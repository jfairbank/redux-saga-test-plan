// @flow
import isEqual from 'lodash.isequal';
import assign from 'object-assign';

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

import {
  ARGUMENT,
  ERROR,
  NONE,
  FINISH,
  FINISH_ARGUMENT,
} from './historyTypes';

import SagaTestError from './SagaTestError';
import identity from './identity';
import createErrorMessage from './createErrorMessage';
import assertSameEffect from './assertSameEffect';

export default function testSaga(
  saga: Function,
  ...sagaArgs: Array<any>
): Api {
  const api = { next, back, finish, restart, save, restore, throw: throwError };

  const savePoints: SavePoints = {};
  let history: Array<HistoryItem> = [];
  let finalSagaArgs = sagaArgs;
  let iterator = createIterator();

  function createEffectTester(
    name: string,
    key?: string,
    effect: Function = identity,
  ): EffectTesterCreator {
    return (yieldedValue) => (...args) => {
      assertSameEffect(name, key, yieldedValue, effect(...args), history.length);
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
          history.length,
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
          history.length,
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
    { value, done }: IteratorResult<*, *>,
  ): ApiWithEffectsTesters {
    return assign({}, api, {
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
    });
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
      history.push(({ type: NONE }: HistoryItemNone));
      result = iterator.next();
    } else {
      history.push(({ type: ARGUMENT, value: arg }: HistoryItemArgument));
      result = iterator.next(arg);
    }

    return apiWithEffectsTesters(result);
  }

  function finish(...args: Array<any>): ApiWithEffectsTesters {
    const arg = args[0];
    let result;

    if (args.length === 0) {
      history.push(({ type: FINISH }: HistoryItemFinish));
      result = iterator.return();
    } else {
      history.push(({ type: FINISH_ARGUMENT, value: arg }: HistoryItemFinishArgument));
      result = iterator.return(arg);
    }

    return apiWithEffectsTesters(result);
  }

  function throwError(error: Error): ApiWithEffectsTesters {
    history.push(({ type: ERROR, value: error }: HistoryItemError));

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
