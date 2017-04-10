// @flow
import { actionChannel, flush, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

const fakeChannel = {
  take() {},
  close() {},
};

test('uses provided value for `flush`', () => {
  function* saga() {
    const channel = yield actionChannel('FOO');
    const value = yield flush(channel);

    yield put({ type: 'DONE', payload: value });
  }

  return expectSaga(saga)
    .provide({
      actionChannel: () => fakeChannel,

      flush(channel, next) {
        if (channel === fakeChannel) {
          return 'flushed';
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 'flushed' })
    .run();
});
