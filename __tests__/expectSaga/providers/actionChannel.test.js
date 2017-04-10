// @flow
import { actionChannel, put, take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

const fakeChannel = {
  take() {},
  close() {},
};

test('uses provided value for `actionChannel`', () => {
  function* saga() {
    const channel = yield actionChannel('FOO');
    const otherChannel = yield actionChannel('BAR');

    const [action, otherAction] = yield [
      take(channel),
      take(otherChannel),
    ];

    const payload = action.payload + otherAction.payload;

    yield put({ payload, type: 'DONE' });
  }

  return expectSaga(saga)
    .provide({
      actionChannel({ pattern }, next) {
        if (pattern === 'FOO') {
          return fakeChannel;
        }

        return next();
      },

      take({ channel }, next) {
        if (channel === fakeChannel) {
          return { type: 'HELLO', payload: 40 };
        }

        if (channel) {
          return { type: 'WORLD', payload: 2 };
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 42 })
    .run();
});
