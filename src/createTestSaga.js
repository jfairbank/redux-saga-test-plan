// @flow
import isEqual from 'lodash.isequal';
import assign from 'object-assign';

import {
  ARGUMENT,
  ERROR,
  NONE,
  FINISH,
  FINISH_ARGUMENT,
} from './historyTypes';

import {
  ACTION_CHANNEL,
  CALL,
  CANCEL,
  CANCELLED,
  CPS,
  FLUSH,
  FORK,
  JOIN,
  PUT,
  RACE,
  SELECT,
  TAKE,
} from './keys';

import SagaTestError from './SagaTestError';
import identity from './identity';
import createErrorMessage from './createErrorMessage';
import assertSameEffect from './assertSameEffect';
import validateTakeHelperEffects from './validateTakeHelperEffects';
import validateThrottleHelperEffect from './validateThrottleHelperEffect';

export default function createTestSaga(rs: Object): Function {
  const {
    effects,
    utils: { is },
  } = rs;

  return function testSaga(saga: Function, ...sagaArgs: Array<any>): Api {
    const api = {
      next,
      back,
      finish,
      restart,
      save,
      restore,
      throw: throwError,
      takeEvery: createTakeHelperProgresser('takeEvery'),
      takeLatest: createTakeHelperProgresser('takeLatest'),
      throttle: createThrottleHelperProgresser('throttle'),
    };

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
        assertSameEffect(
          rs.eventChannel,
          name,
          key,
          yieldedValue,
          effect(...args),
          history.length,
        );

        return api;
      };
    }

    function createEffectTesterFromEffects(
      name: string,
      key: string,
    ): EffectTesterCreator {
      if (!(name in effects)) {
        return () => () => {
          throw new Error(
            `The ${name} effect is not available in your version of redux-saga.`,
          );
        };
      }

      return createEffectTester(name, key, effects[name]);
    }

    function createEffectHelperTester(name: string): EffectTesterCreator {
      if (!(name in rs)) {
        return () => () => {
          throw new Error(`Your version of redux-saga does not support ${name}.`);
        };
      }

      if (!('helper' in is)) {
        return () => () => {
          throw new Error(
            `Your version of redux-saga does not support yielding ${name} directly.`,
          );
        };
      }

      // eslint-disable-next-line import/namespace
      return createEffectTester(name, undefined, rs[name]);
    }

    const effectsTestersCreators: EffectTestersCreator = {
      actionChannel: createEffectTesterFromEffects('actionChannel', ACTION_CHANNEL),
      apply: createEffectTesterFromEffects('apply', CALL),
      call: createEffectTesterFromEffects('call', CALL),
      cancel: createEffectTesterFromEffects('cancel', CANCEL),
      cancelled: createEffectTesterFromEffects('cancelled', CANCELLED),
      cps: createEffectTesterFromEffects('cps', CPS),
      flush: createEffectTesterFromEffects('flush', FLUSH),
      fork: createEffectTesterFromEffects('fork', FORK),
      join: createEffectTesterFromEffects('join', JOIN),
      parallel: createEffectTester('parallel'),
      put: createEffectTesterFromEffects('put', PUT),
      race: createEffectTesterFromEffects('race', RACE),
      select: createEffectTesterFromEffects('select', SELECT),
      spawn: createEffectTesterFromEffects('spawn', FORK),
      take: createEffectTesterFromEffects('take', TAKE),
      takem: createEffectTesterFromEffects('takem', TAKE),
      takeEveryFork: createEffectHelperTester('takeEvery'),
      takeLatestFork: createEffectHelperTester('takeLatest'),
      throttleFork: createEffectHelperTester('throttle'),

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
            arg,
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
            arg,
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
        flush: effectsTestersCreators.flush(value),
        fork: effectsTestersCreators.fork(value),
        join: effectsTestersCreators.join(value),
        parallel: effectsTestersCreators.parallel(value),
        put: effectsTestersCreators.put(value),
        race: effectsTestersCreators.race(value),
        select: effectsTestersCreators.select(value),
        spawn: effectsTestersCreators.spawn(value),
        take: effectsTestersCreators.take(value),
        takem: effectsTestersCreators.takem(value),
        takeEveryFork: effectsTestersCreators.takeEveryFork(value),
        takeLatestFork: effectsTestersCreators.takeLatestFork(value),
        throttleFork: effectsTestersCreators.throttleFork(value),
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

    function createTakeHelperProgresser(helperName: string) {
      // eslint-disable-next-line import/namespace
      const helper = rs[helperName];

      return function takeHelperProgresser(
        pattern: TakePattern,
        otherSaga: Function,
        ...args: Array<mixed>
      ): Api {
        const errorMessage = validateTakeHelperEffects(
          helperName,
          iterator, // this will be mutated (i.e. 2 steps will be taken)
          helper(pattern, otherSaga, ...args),
          history.length + 1,
        );

        history.push(({ type: NONE }: HistoryItemNone));
        history.push(({ type: NONE }: HistoryItemNone));

        if (errorMessage) {
          throw new SagaTestError(errorMessage);
        }

        return api;
      };
    }

    function createThrottleHelperProgresser(helperName: string) {
      if (!(helperName in rs)) {
        return () => {
          throw new Error(`Your version of redux-saga does not support ${helperName}.`);
        };
      }

      // eslint-disable-next-line import/namespace
      const helper = rs[helperName];

      return function throttleHelperProgresser(
        delayTime: number,
        pattern: TakePattern,
        otherSaga: Function,
        ...args: Array<mixed>
      ): Api {
        const errorMessage = validateThrottleHelperEffect(
          rs.eventChannel,
          helperName,
          iterator, // this will be mutated (i.e. 4 steps will be taken)
          helper(delayTime, pattern, otherSaga, ...args),
          history.length + 1,
        );

        history.push(({ type: NONE }: HistoryItemNone));
        history.push(({ type: NONE }: HistoryItemNone));
        history.push(({ type: NONE }: HistoryItemNone));
        history.push(({ type: NONE }: HistoryItemNone));

        if (errorMessage) {
          throw new SagaTestError(errorMessage);
        }

        return api;
      };
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
  };
}
