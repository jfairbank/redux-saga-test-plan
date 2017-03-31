// @flow
/* eslint-disable no-constant-condition, no-underscore-dangle */
import { effects, runSaga, utils } from 'redux-saga';
import { fork, race, spawn } from 'redux-saga/effects';
import assign from 'object-assign';
import isMatch from 'lodash.ismatch';
import SagaTestError from './SagaTestError';
import { splitAt } from './utils/array';
import Map from './utils/Map';
import ArraySet from './utils/ArraySet';
import serializeEffect from './serializeEffect';
import { warn } from './utils/logging';
import { delay, schedule } from './utils/async';
import identity from './utils/identity';
import reportActualEffects from './reportActualEffects';
import parseEffect from './parseEffect';
import { NO_FAKE_VALUE, provideValue } from './provideValue';
import { mapValues } from './utils/object';
import findDispatchableActionIndex from './findDispatchableActionIndex';

import {
  ACTION_CHANNEL,
  CALL,
  CPS,
  FORK,
  PROMISE,
  PUT,
  RACE,
  SELECT,
  TAKE,
} from './keys';

const { asEffect, is } = utils;

const INIT_ACTION = { type: '@@redux-saga-test-plan/INIT' };

function extractState(reducer: Reducer, initialState?: any): any {
  return initialState || reducer(undefined, INIT_ACTION);
}

export default function expectSaga(generator: Function, ...sagaArgs: mixed[]): ExpectApi {
  const effectStores = {
    [TAKE]: new ArraySet(),
    [PUT]: new ArraySet(),
    [RACE]: new ArraySet(),
    [CALL]: new ArraySet(),
    [CPS]: new ArraySet(),
    [FORK]: new ArraySet(),
    [SELECT]: new ArraySet(),
    [ACTION_CHANNEL]: new ArraySet(),
    [PROMISE]: new ArraySet(),
  };

  const expectations = [];
  const queuedActions = [];
  const listeners = [];
  const forkedTasks = [];
  const outstandingForkEffects = new Map();
  const outstandingActionChannelEffects = new Map();
  const channelsToPatterns = new Map();
  const dispatchPromise = Promise.resolve();

  let stopDirty = false;
  let negateNextAssertion = false;
  let isRunning = false;
  let delayTime = null;

  let iterator;
  let mainTask;
  let mainTaskPromise;
  let providers;

  let storeState: any;

  function useProvidedValue(value) {
    const fakeValue = provideValue(providers, value);

    if (fakeValue === NO_FAKE_VALUE) {
      return value;
    }

    return fakeValue;
  }

  function refineYieldedValue(result) {
    const { value } = result;

    const raceEffect = asEffect.race(value);
    const yieldedRace = is.notUndef(raceEffect);
    const haveRaceProvider = providers && providers.race;

    if (yieldedRace && !haveRaceProvider) {
      return race(mapValues(raceEffect, useProvidedValue));
    }

    const yieldedArray = Array.isArray(value);
    const haveParallelProvider = providers && providers.parallel;

    if (yieldedArray && !haveParallelProvider) {
      return value.map(useProvidedValue);
    }

    const forkEffect = asEffect.fork(value);
    const yieldedFork = is.notUndef(forkEffect);
    const provideInForkedTasks = providers && providers.provideInForkedTasks;
    const haveForkProvider = providers && providers.fork;

    if (yieldedFork && provideInForkedTasks && !forkEffect.detached && !haveForkProvider) {
      const { args, context, fn } = forkEffect;
      return fork(sagaWrapper, fn.apply(context, args), true);
    }

    const haveSpawnProvider = providers && providers.spawn;

    if (yieldedFork && provideInForkedTasks && forkEffect.detached && !haveSpawnProvider) {
      const { args, context, fn } = forkEffect;
      return spawn(sagaWrapper, fn.apply(context, args));
    }

    return useProvidedValue(value);
  }

  function* sagaWrapper(wrappedIterator) {
    let result = wrappedIterator.next();

    while (true) {
      try {
        const value = refineYieldedValue(result);
        const response = yield value;

        result = wrappedIterator.next(response);
      } catch (e) {
        result = wrappedIterator.throw(e);
      }

      if (result.done) {
        break;
      }
    }
  }

  function defaultReducer(state = storeState) {
    return state;
  }

  let reducer: Reducer = defaultReducer;

  function getAllPromises(): Promise<*> {
    return new Promise(resolve => {
      Promise.all([
        ...effectStores[PROMISE].values(),
        ...forkedTasks.map(task => task.done),
        mainTaskPromise,
      ]).then(() => {
        if (stopDirty) {
          stopDirty = false;
          resolve(getAllPromises());
        }
        resolve();
      });
    });
  }

  function addForkedTask(task: Task): void {
    stopDirty = true;
    forkedTasks.push(task);
  }

  function cancelMainTask(
    timeout: number,
    silenceTimeout: boolean,
    timedOut: boolean,
  ): Promise<*> {
    if (!silenceTimeout && timedOut) {
      warn(`Saga exceeded async timeout of ${timeout}ms`);
    }

    mainTask.cancel();

    return mainTaskPromise;
  }

  function scheduleStop(timeout: Timeout | TimeoutConfig): Promise<*> {
    let promise = schedule(getAllPromises).then(() => false);
    let silenceTimeout = false;
    let timeoutLength: ?Timeout;

    if (typeof timeout === 'number') {
      timeoutLength = timeout;
    } else if (typeof timeout === 'object') {
      silenceTimeout = timeout.silenceTimeout === true;

      if ('timeout' in timeout) {
        timeoutLength = timeout.timeout;
      } else {
        timeoutLength = expectSaga.DEFAULT_TIMEOUT;
      }
    }

    if (typeof timeoutLength === 'number') {
      promise = Promise.race([
        promise,
        delay(timeoutLength).then(() => true),
      ]);
    }

    return promise.then(
      timedOut => schedule(cancelMainTask, [
        timeoutLength,
        silenceTimeout,
        timedOut,
      ]),
    );
  }

  function queueAction(action: Action): void {
    queuedActions.push(action);
  }

  function notifyListeners(action: Action): void {
    listeners.forEach((listener) => {
      listener(action);
    });
  }

  function dispatch(action: Action): any {
    function handler() {
      storeState = reducer(storeState, action);
      notifyListeners(action);
    }

    if (typeof action._delayTime === 'number') {
      const { _delayTime } = action;

      dispatchPromise
        .then(() => delay(_delayTime))
        .then(handler);
    } else {
      dispatchPromise.then(handler);
    }
  }

  function associateChannelWithPattern(channel: Object, pattern: any): void {
    channelsToPatterns.set(channel, pattern);
  }

  function getDispatchableActions(effect: Object): Array<Action> {
    const pattern = effect.pattern || channelsToPatterns.get(effect.channel);
    const index = findDispatchableActionIndex(queuedActions, pattern);

    if (index > -1) {
      const actions = queuedActions.splice(0, index + 1);
      return actions;
    }

    return [];
  }

  function processEffect(event: Object): void {
    const effectType = parseEffect(event.effect);

    // Using string literal for flow
    if (effectType === 'NONE') {
      return;
    }

    const effectStore = effectStores[effectType];

    if (!effectStore) {
      return;
    }

    effectStore.add(event.effect);

    switch (effectType) {
      case FORK: {
        const effect = asEffect.fork(event.effect);
        outstandingForkEffects.set(event.effectId, effect);
        break;
      }

      case TAKE: {
        const effect = asEffect.take(event.effect);
        const actions = getDispatchableActions(effect);

        const [reducerActions, [sagaAction]] = splitAt(actions, -1);

        reducerActions.forEach((action) => {
          dispatch(action);
        });

        if (sagaAction) {
          dispatch(sagaAction);
        }

        break;
      }

      case ACTION_CHANNEL: {
        const effect = asEffect.actionChannel(event.effect);
        outstandingActionChannelEffects.set(event.effectId, effect);
        break;
      }

      // no default
    }
  }

  const io = {
    subscribe(listener: Function): Function {
      listeners.push(listener);

      return () => {
        const index = listeners.indexOf(listener);
        listeners.splice(index, 1);
      };
    },

    dispatch,

    getState(): any {
      return storeState;
    },

    sagaMonitor: {
      effectTriggered(event: Object): void {
        processEffect(event);
      },

      effectResolved(effectId: number, value: any): void {
        const forkEffect = outstandingForkEffects.get(effectId);

        if (forkEffect) {
          addForkedTask(value);
          return;
        }

        const actionChannelEffect = outstandingActionChannelEffects.get(effectId);

        if (actionChannelEffect) {
          associateChannelWithPattern(value, actionChannelEffect.pattern);
        }
      },

      effectRejected() {},
      effectCancelled() {},
    },
  };

  const api = {
    run,
    withState,
    withReducer,
    provide,
    dispatch: apiDispatch,
    delay: apiDelay,

    // $FlowFixMe
    get not() {
      negateNextAssertion = true;
      return api;
    },

    actionChannel: createEffectTesterFromEffects('actionChannel', ACTION_CHANNEL, asEffect.actionChannel),
    apply: createEffectTesterFromEffects('apply', CALL, asEffect.call),
    call: createEffectTesterFromEffects('call', CALL, asEffect.call),
    cps: createEffectTesterFromEffects('cps', CPS, asEffect.cps),
    fork: createEffectTesterFromEffects('fork', FORK, asEffect.fork),
    put: createEffectTesterFromEffects('put', PUT, asEffect.put),
    race: createEffectTesterFromEffects('race', RACE, asEffect.race),
    select: createEffectTesterFromEffects('select', SELECT, asEffect.select),
    spawn: createEffectTesterFromEffects('spawn', FORK, asEffect.fork),
    take: createEffectTesterFromEffects('take', TAKE, asEffect.take),
  };

  api.put.resolve = createEffectTester('put.resolve', PUT, effects.put.resolve, asEffect.put);
  api.take.maybe = createEffectTester('take.maybe', TAKE, effects.take.maybe, asEffect.take);

  api.actionChannel.like = createEffectTester('actionChannel', ACTION_CHANNEL, effects.actionChannel, asEffect.actionChannel, true);
  api.actionChannel.pattern = pattern => api.actionChannel.like({ pattern });

  api.apply.like = createEffectTester('apply', CALL, effects.apply, asEffect.call, true);
  api.apply.fn = fn => api.apply.like({ fn });

  api.call.like = createEffectTester('call', CALL, effects.call, asEffect.call, true);
  api.call.fn = fn => api.call.like({ fn });

  api.cps.like = createEffectTester('cps', CPS, effects.cps, asEffect.cps, true);
  api.cps.fn = fn => api.cps.like({ fn });

  api.fork.like = createEffectTester('fork', FORK, effects.fork, asEffect.fork, true);
  api.fork.fn = fn => api.fork.like({ fn });

  api.put.like = createEffectTester('put', PUT, effects.put, asEffect.put, true);
  api.put.actionType = type => api.put.like({ action: { type } });

  api.put.resolve.like = createEffectTester('put', PUT, effects.put, asEffect.put, true);
  api.put.resolve.actionType = type => api.put.resolve.like({ action: { type } });

  api.select.like = createEffectTester('select', SELECT, effects.select, asEffect.select, true);
  api.select.selector = selector => api.select.like({ selector });

  api.spawn.like = createEffectTester('spawn', FORK, effects.spawn, asEffect.fork, true);
  api.spawn.fn = fn => api.spawn.like({ fn });

  function checkExpectations(): void {
    expectations.forEach(({
      effectName,
      expectedEffect,
      store,
      storeKey,
      expectToHave,
      like,
      extractEffect,
    }) => {
      const deleted = like
        ? store.deleteBy(item => isMatch(extractEffect(item), expectedEffect))
        : store.delete(expectedEffect);

      let errorMessage = '';

      if (deleted && !expectToHave) {
        const serializedEffect = serializeEffect(expectedEffect, storeKey);

        errorMessage = `\n${effectName} expectation unmet:` +
                       `\n\nNot Expected\n------------\n${serializedEffect}\n`;
      } else if (!deleted && expectToHave) {
        const serializedEffect = serializeEffect(expectedEffect, storeKey);

        errorMessage = `\n${effectName} expectation unmet:` +
                       `\n\nExpected\n--------\n${serializedEffect}\n`;

        errorMessage += reportActualEffects(store, storeKey, effectName);
      }

      if (errorMessage) {
        throw new SagaTestError(errorMessage);
      }
    });
  }

  function apiDispatch(action: Action): ExpectApi {
    let dispatchableAction;

    if (typeof delayTime === 'number') {
      dispatchableAction = assign({}, action, {
        _delayTime: delayTime,
      });

      delayTime = null;
    } else {
      dispatchableAction = action;
    }

    if (isRunning) {
      dispatch(dispatchableAction);
    } else {
      queueAction(dispatchableAction);
    }

    return api;
  }

  function start(): ExpectApi {
    isRunning = true;
    iterator = generator(...sagaArgs);

    mainTask = runSaga(sagaWrapper(iterator), io);

    mainTaskPromise = mainTask.done
      .then(checkExpectations)
      // Pass along the error instead of rethrowing or allowing to
      // bubble up to avoid PromiseRejectionHandledWarning
      .catch(identity);

    return api;
  }

  function stop(timeout: Timeout | TimeoutConfig): Promise<*> {
    return scheduleStop(timeout).then((err) => {
      if (err) {
        throw err;
      }
    });
  }

  function run(
    timeout?: Timeout | TimeoutConfig = expectSaga.DEFAULT_TIMEOUT,
  ): Promise<*> {
    start();
    return stop(timeout);
  }

  function withState(state: any): ExpectApi {
    storeState = state;
    return api;
  }

  function withReducer(newReducer: Reducer, initialState?: any): ExpectApi {
    reducer = newReducer;

    storeState = extractState(newReducer, initialState);

    return api;
  }

  function provide(newProviders) {
    providers = newProviders;
    return api;
  }

  function apiDelay(time: number): ExpectApi {
    delayTime = time;
    return api;
  }

  function createEffectTester(
    effectName: string,
    storeKey: string,
    effectCreator: Function,
    extractEffect: Function,
    like: boolean = false,
  ): Function {
    return (...args: mixed[]) => {
      const expectedEffect = like
        ? args[0]
        : effectCreator(...args);

      expectations.push({
        effectName,
        expectedEffect,
        storeKey,
        like,
        extractEffect,
        store: effectStores[storeKey],
        expectToHave: !negateNextAssertion,
      });

      negateNextAssertion = false;

      return api;
    };
  }

  function createEffectTesterFromEffects(
    effectName: string,
    storeKey: string,
    extractEffect: Function,
  ): Function {
    return createEffectTester(effectName, storeKey, effects[effectName], extractEffect);
  }

  return api;
}

expectSaga.DEFAULT_TIMEOUT = 250;
