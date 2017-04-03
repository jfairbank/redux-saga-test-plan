// @flow
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
  PROMISE,
  PUT,
  RACE,
  SELECT,
  TAKE,
} from '../shared/keys';

const { asEffect, is } = utils;

export default function parseEffect(effect: Object): string {
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

    case is.notUndef(asEffect.cancel(effect)):
      return CANCEL;

    case is.notUndef(asEffect.cancelled(effect)):
      return CANCELLED;

    case is.notUndef(asEffect.cps(effect)):
      return CPS;

    case is.notUndef(asEffect.flush(effect)):
      return FLUSH;

    case is.notUndef(asEffect.fork(effect)):
      return FORK;

    case is.notUndef(asEffect.join(effect)):
      return JOIN;

    case is.notUndef(asEffect.select(effect)):
      return SELECT;

    case is.notUndef(asEffect.actionChannel(effect)):
      return ACTION_CHANNEL;

    default:
      return NONE;
  }
}
