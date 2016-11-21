import SagaTestError from './SagaTestError';
import FakeSet from './FakeSet';
import serializeEffect from './serializeEffect';
import { warn } from './utils/logging';
import { delay, schedule } from './utils/async';
import { findIndex } from './utils/array';

import {
  ACTION_CHANNEL,
  CALL,
  CANCEL,
  CANCELLED,
  CPS,
  FLUSH,
  FORK,
  JOIN,
  NONE,
  PROMISE,
  PUT,
  RACE,
  SELECT,
  TAKE,
} from './keys';

const DEFAULT_TIMEOUT = 250;

const emptySet = {
  add() {},
  delete() { return false; },
};

export default function createExpectSaga(rs) {
  const {
    effects,
    runSaga,
    utils: { asEffect, is },
  } = rs;

  return function expectSaga(generator, ...sagaArgs) {
    const effectStores = {
      [TAKE]: new FakeSet(),
      [PUT]: new FakeSet(),
      [RACE]: new FakeSet(),
      [CALL]: new FakeSet(),
      [CPS]: new FakeSet(),
      [FORK]: new FakeSet(),
      [JOIN]: new FakeSet(),
      [CANCEL]: new FakeSet(),
      [SELECT]: new FakeSet(),
      [ACTION_CHANNEL]: new FakeSet(),
      [CANCELLED]: new FakeSet(),
      [FLUSH]: new FakeSet(),
      [PROMISE]: new FakeSet(),
      [NONE]: emptySet,
    };

    const expectations = [];
    const queuedActions = [];
    const listeners = [];
    const forkedTasks = [];
    const outstandingForkEffects = new FakeSet();

    let isWaitingOnTake = false;
    let stopDirty = false;

    let iterator;
    let mainTask;

    function getAllPromises() {
      const promises = [
        ...effectStores[PROMISE].values(),
        ...forkedTasks.map(task => task.done),
      ];

      return Promise.all(promises);
    }

    function isForkEffectId(effectId) {
      return outstandingForkEffects.has(effectId);
    }

    function addForkedTask(task) {
      stopDirty = true;
      forkedTasks.push(task);
    }

    function cancelMainTask(timeout, timedOut) {
      if (stopDirty) {
        stopDirty = false;
        scheduleStop(timeout);
      } else {
        if (timedOut) {
          warn(`Saga exceeded async timeout of ${timeout}ms`);
        }

        mainTask.cancel();
      }
    }

    function scheduleStop(timeout) {
      let promise = schedule(getAllPromises).then(() => false);

      if (timeout > 0) {
        promise = Promise.race([
          promise,
          delay(timeout).then(() => true),
        ]);
      }

      promise.then(timedOut => schedule(cancelMainTask, [timeout, timedOut]));
    }

    function stop(timeout = DEFAULT_TIMEOUT) {
      scheduleStop(timeout);
    }

    function queueAction(action) {
      queuedActions.push(action);
    }

    function notifyListeners(value) {
      listeners.forEach((listener) => {
        listener(value);
      });
    }

    function notifyNextAction(effect) {
      if (queuedActions.length > 0) {
        const index = findIndex(queuedActions, ({ type }) => type === effect.pattern);

        if (index !== -1) {
          const [action] = queuedActions.splice(index, 1);
          notifyListeners(action);
        }
      }
    }

    function parseEffect(effect) {
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

        case is.notUndef(asEffect.join(effect)):
          return JOIN;

        case is.notUndef(asEffect.cancel(effect)):
          return CANCEL;

        case is.notUndef(asEffect.select(effect)):
          return SELECT;

        case is.notUndef(asEffect.actionChannel(effect)):
          return ACTION_CHANNEL;

        case is.notUndef(asEffect.flush(effect)):
          return FLUSH;

        case is.notUndef(asEffect.cancelled(effect)):
          return CANCELLED;

        default:
          return NONE;
      }
    }

    function storeEffect(event) {
      const effectType = parseEffect(event.effect);
      const effectStore = effectStores[effectType];

      if (effectType === FORK) {
        outstandingForkEffects.add(event.effectId);
      }

      effectStore.add(event.effect);

      isWaitingOnTake = effectType === TAKE;

      if (isWaitingOnTake) {
        schedule(notifyNextAction, [asEffect.take(event.effect)]);
      }
    }

    const io = {
      subscribe(listener) {
        listeners.push(listener);

        return () => {
          const index = listeners.indexOf(listener);

          if (index !== -1) {
            listeners.splice(index, 1);
          }
        };
      },

      dispatch: notifyListeners,

      getState() {},

      sagaMonitor: {
        effectTriggered(event) {
          storeEffect(event);
        },

        effectResolved(effectId, value) {
          if (isForkEffectId(effectId)) {
            addForkedTask(value);
          }
        },

        effectCancelled() {},
      },
    };

    const api = {
      dispatch,
      start,
      stop,

      actionChannel: createEffectTesterFromEffects('actionChannel', ACTION_CHANNEL),
      apply: createEffectTesterFromEffects('apply', CALL),
      call: createEffectTesterFromEffects('call', CALL),
      cancel: createEffectTesterFromEffects('cancel', CANCEL),
      cancelled: createEffectTesterFromEffects('cancelled', CANCELLED),
      cps: createEffectTesterFromEffects('cps', CPS),
      flush: createEffectTesterFromEffects('flush', FLUSH),
      fork: createEffectTesterFromEffects('fork', FORK),
      join: createEffectTesterFromEffects('join', JOIN),
      put: createEffectTesterFromEffects('put', PUT),
      race: createEffectTesterFromEffects('race', RACE),
      select: createEffectTesterFromEffects('select', SELECT),
      spawn: createEffectTesterFromEffects('spawn', FORK),
      take: createEffectTesterFromEffects('take', TAKE),
      takem: createEffectTesterFromEffects('takem', TAKE),
    };

    function checkExpectations() {
      expectations.forEach(({ effectName, expectedEffect, store, storeKey }) => {
        const deleted = store.delete(expectedEffect);

        if (!deleted) {
          const serializedEffect = serializeEffect(expectedEffect, storeKey);
          const errorMessage = `\n${effectName} expectation unmet:` +
                               `\n\nExpected\n--------\n${serializedEffect}\n`;

          throw new SagaTestError(errorMessage);
        }
      });
    }

    function reportError(e) {
      setImmediate(() => { throw e; });
    }

    function dispatch(action) {
      if (isWaitingOnTake) {
        notifyListeners(action);
      } else {
        queueAction(action);
      }

      return api;
    }

    function start() {
      iterator = generator(...sagaArgs);

      mainTask = runSaga(iterator, io);

      mainTask.done
        .then(checkExpectations)
        .catch(reportError);

      return api;
    }

    function createEffectTester(effectName, storeKey, effectCreator) {
      return (...args) => {
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

    function createEffectTesterFromEffects(effectName, storeKey) {
      return createEffectTester(effectName, storeKey, effects[effectName]);
    }

    return api;
  };
}
