// @flow
/* eslint-disable no-cond-assign */
import { utils } from 'redux-saga';

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
  PARALLEL,
  PROMISE,
  PUT,
  RACE,
  SELECT,
  TAKE,
} from '../shared/keys';

const { asEffect, is } = utils;

export default function parseEffect(effect: Object): Object {
  let parsedEffect;

  switch (true) {
    case is.promise(effect):
      return { type: PROMISE, promise: effect };

    case is.notUndef(parsedEffect = asEffect.take(effect)):
      return {
        type: TAKE,
        effect: parsedEffect,
        providerKey: 'take',
      };

    case is.notUndef(parsedEffect = asEffect.put(effect)):
      return {
        type: PUT,
        effect: parsedEffect,
        providerKey: 'put',
      };

    case is.notUndef(parsedEffect = asEffect.race(effect)):
      return {
        type: RACE,
        effect: parsedEffect,
        providerKey: 'race',
      };

    case is.notUndef(parsedEffect = asEffect.call(effect)):
      return {
        type: CALL,
        effect: parsedEffect,
        providerKey: 'call',
      };

    case is.notUndef(parsedEffect = asEffect.cancel(effect)):
      return {
        type: CANCEL,
        effect: parsedEffect,
        providerKey: 'cancel',
      };

    case is.notUndef(parsedEffect = asEffect.cancelled(effect)):
      return {
        type: CANCELLED,
        effect: parsedEffect,
        providerKey: 'cancelled',
      };

    case is.notUndef(parsedEffect = asEffect.cps(effect)):
      return {
        type: CPS,
        effect: parsedEffect,
        providerKey: 'cps',
      };

    case is.notUndef(parsedEffect = asEffect.flush(effect)):
      return {
        type: FLUSH,
        effect: parsedEffect,
        providerKey: 'flush',
      };

    case is.notUndef(parsedEffect = asEffect.fork(effect)):
      return {
        type: FORK,
        effect: parsedEffect,
        providerKey: parsedEffect.detached ? 'spawn' : 'fork',
      };

    case is.notUndef(parsedEffect = asEffect.join(effect)):
      return {
        type: JOIN,
        effect: parsedEffect,
        providerKey: 'join',
      };

    case is.notUndef(parsedEffect = asEffect.select(effect)):
      return {
        type: SELECT,
        effect: parsedEffect,
        providerKey: 'select',
      };

    case is.notUndef(parsedEffect = asEffect.actionChannel(effect)):
      return {
        type: ACTION_CHANNEL,
        effect: parsedEffect,
        providerKey: 'actionChannel',
      };

    case Array.isArray(effect):
      return { type: PARALLEL, effects: effect };

    default:
      return { type: NONE };
  }
}
