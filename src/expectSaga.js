// @flow
import { effects, runSaga, utils } from 'redux-saga';
import SagaTestError from './SagaTestError';
import Map from './utils/Map';
import ArraySet from './utils/ArraySet';
import serializeEffect from './serializeEffect';
import { warn } from './utils/logging';
import { delay, schedule } from './utils/async';
import identity from './utils/identity';
import reportActualEffects from './reportActualEffects';

import {
  ACTION_CHANNEL,
  CALL,
  CPS,
  FORK,
  NONE,
  PROMISE,
  PUT,
  RACE,
  SELECT,
  TAKE,
} from './keys';

const { asEffect, is } = utils;

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

  let stopDirty = false;

  let iterator;
  let mainTask;
  let mainTaskPromise;

  function getAllPromises(): Promise<*> {
    return Promise.all([
      ...effectStores[PROMISE].values(),
      ...forkedTasks.map(task => task.done),
      mainTaskPromise,
    ]);
  }

  function addForkedTask(task: Task): void {
    stopDirty = true;
    forkedTasks.push(task);
  }

  function cancelMainTask(timeout: number, timedOut: boolean): Promise<*> {
    if (stopDirty) {
      stopDirty = false;
      return scheduleStop(timeout);
    }

    if (timedOut) {
      warn(`Saga exceeded async timeout of ${timeout}ms`);
    }

    mainTask.cancel();

    return mainTaskPromise;
  }

  function scheduleStop(timeout: Timeout): Promise<*> {
    let promise = schedule(getAllPromises).then(() => false);

    if (typeof timeout === 'number') {
      promise = Promise.race([
        promise,
        delay(timeout).then(() => true),
      ]);
    }

    return promise.then(
      timedOut => schedule(cancelMainTask, [timeout, timedOut]),
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

  function notifyNextAction(): void {
    if (queuedActions.length > 0) {
      const action = queuedActions.shift();
      notifyListeners(action);
    }
  }

  function parseEffect(effect: Object): string {
    switch (true) {
      case is.promise(effect):
        return PROMISE;

      case is.notUndef(asEffect.take(effect)):
        return TAKE;

      case is.notUndef(asEffect.put(effect)):
        return PUT;

      case is.notUndef(asEffect.race(effect)):
        return RACE;

      case is.notUndef(asEffect.call(effect)):
        return CALL;

      case is.notUndef(asEffect.cps(effect)):
        return CPS;

      case is.notUndef(asEffect.fork(effect)):
        return FORK;

      case is.notUndef(asEffect.select(effect)):
        return SELECT;

      case is.notUndef(asEffect.actionChannel(effect)):
        return ACTION_CHANNEL;

      default:
        return NONE;
    }
  }

  function storeEffect(event: Object): void {
    const effectType = parseEffect(event.effect);

    // Using string literal for flow
    if (effectType === 'NONE') {
      return;
    }

    const effectStore = effectStores[effectType];

    if (effectType === FORK) {
      const effect = asEffect.fork(event.effect);
      outstandingForkEffects.set(event.effectId, effect);
    }

    effectStore.add(event.effect);

    if (effectType === TAKE) {
      schedule(notifyNextAction);
    }
  }

  let storeState: mixed;

  const io = {
    subscribe(listener: Function): Function {
      listeners.push(listener);

      return () => {
        const index = listeners.indexOf(listener);
        listeners.splice(index, 1);
      };
    },

    dispatch: notifyListeners,

    getState(): mixed {
      return storeState;
    },

    sagaMonitor: {
      effectTriggered(event: Object): void {
        storeEffect(event);
      },

      effectResolved(effectId: number, value: any): void {
        const forkEffect = outstandingForkEffects.get(effectId);

        if (forkEffect) {
          addForkedTask(value);
        }
      },

      effectRejected() {},
      effectCancelled() {},
    },
  };

  const api = {
    dispatch,
    run,
    withState,

    actionChannel: createEffectTesterFromEffects('actionChannel', ACTION_CHANNEL),
    apply: createEffectTesterFromEffects('apply', CALL),
    call: createEffectTesterFromEffects('call', CALL),
    cps: createEffectTesterFromEffects('cps', CPS),
    fork: createEffectTesterFromEffects('fork', FORK),
    put: createEffectTesterFromEffects('put', PUT),
    race: createEffectTesterFromEffects('race', RACE),
    select: createEffectTesterFromEffects('select', SELECT),
    spawn: createEffectTesterFromEffects('spawn', FORK),
    take: createEffectTesterFromEffects('take', TAKE),
  };

  api.put.resolve = createEffectTester('put.resolve', PUT, effects.put.resolve);
  api.take.maybe = createEffectTester('take.maybe', TAKE, effects.take.maybe);

  function checkExpectations(): void {
    expectations.forEach(({ effectName, expectedEffect, store, storeKey }) => {
      const deleted = store.delete(expectedEffect);

      if (!deleted) {
        const serializedEffect = serializeEffect(expectedEffect, storeKey);
        let errorMessage = `\n${effectName} expectation unmet:` +
                           `\n\nExpected\n--------\n${serializedEffect}\n`;

        errorMessage += reportActualEffects(store, storeKey, effectName);

        throw new SagaTestError(errorMessage);
      }
    });
  }

  function dispatch(action: Action): ExpectApi {
    queueAction(action);
    return api;
  }

  function start(): ExpectApi {
    iterator = generator(...sagaArgs);

    mainTask = runSaga(iterator, io);

    mainTaskPromise = mainTask.done
      .then(checkExpectations)
      // Pass along the error instead of rethrowing or allowing to
      // bubble up to avoid PromiseRejectionHandledWarning
      .catch(identity);

    return api;
  }

  function stop(timeout: Timeout): Promise<*> {
    return scheduleStop(timeout).then((err) => {
      if (err) {
        throw err;
      }
    });
  }

  function run(
    timeout?: Timeout = expectSaga.DEFAULT_TIMEOUT,
  ): Promise<*> {
    start();
    return stop(timeout);
  }

  function withState(state: mixed): ExpectApi {
    storeState = state;
    return api;
  }

  function createEffectTester(
    effectName: string,
    storeKey: string,
    effectCreator: Function,
  ): Function {
    return (...args: mixed[]) => {
      const expectedEffect = effectCreator(...args);

      expectations.push({
        effectName,
        expectedEffect,
        storeKey,
        store: effectStores[storeKey],
      });

      return api;
    };
  }

  function createEffectTesterFromEffects(
    effectName: string,
    storeKey: string,
  ): Function {
    return createEffectTester(effectName, storeKey, effects[effectName]);
  }

  return api;
}

expectSaga.DEFAULT_TIMEOUT = 250;
