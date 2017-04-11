// @flow
import fsmIterator from 'fsm-iterator';

const INIT = 'INIT';
const NEXT = 'NEXT';
const LOOP = 'LOOP';

export default function sagaWrapper(
  wrappedIterator: Generator<*, *, *>,
  refineYieldedValue: Function,
  onReturn: ?Function,
): Generator<*, *, *> {
  let result = wrappedIterator.next();

  function complete() {
    if (typeof onReturn === 'function') {
      onReturn(result.value);
    }

    return {
      value: result.value,
      done: true,
    };
  }

  return fsmIterator(INIT, {
    [INIT](_, fsm) {
      try {
        if (result.done) {
          return complete();
        }

        const value = refineYieldedValue(result.value);

        return {
          value,
          next: NEXT,
        };
      } catch (e) {
        return fsm.throw(e, fsm);
      }
    },

    [NEXT](response, fsm) {
      result = wrappedIterator.next(response);
      return fsm[LOOP](undefined, fsm);
    },

    [LOOP](_, fsm) {
      if (result.done) {
        return complete();
      }

      return fsm[INIT](undefined, fsm);
    },

    throw(e, fsm) {
      result = wrappedIterator.throw(e);
      return fsm[LOOP](undefined, fsm);
    },
  });
}
