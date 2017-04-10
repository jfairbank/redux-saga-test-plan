// @flow
import { actionChannel, flush, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import * as m from '../../../src/expectSaga/matchers';

const fakeChannel = {
  take() {},
  close() {},
};

function* saga() {
  const channel = yield actionChannel('FOO');
  const value = yield flush(channel);

  yield put({ type: 'DONE', payload: value });
}

const actionChannelProvider = { actionChannel: () => fakeChannel };

test('uses provided value for `flush`', () => (
  expectSaga(saga)
    .provide({
      actionChannel: actionChannelProvider.actionChannel,

      flush(channel, next) {
        if (channel === fakeChannel) {
          return 'flushed';
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 'flushed' })
    .run()
));

test('uses static provided values from redux-saga/effects', () => (
  expectSaga(saga)
    .provide([
      [flush(fakeChannel), 'flushed'],
      actionChannelProvider,
    ])
    .put({ type: 'DONE', payload: 'flushed' })
    .run()
));

test('uses static provided values from matchers', () => (
  expectSaga(saga)
    .provide([
      [m.flush(fakeChannel), 'flushed'],
      actionChannelProvider,
    ])
    .put({ type: 'DONE', payload: 'flushed' })
    .run()
));
