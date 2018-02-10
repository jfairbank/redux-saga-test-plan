// @flow
import { actionChannel, flush, put } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

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

test('uses provided value for `flush`', () =>
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
    .run());

test('uses static provided values from redux-saga/effects', () =>
  expectSaga(saga)
    .provide([[flush(fakeChannel), 'flushed'], actionChannelProvider])
    .put({ type: 'DONE', payload: 'flushed' })
    .run());

test('uses static provided values from matchers', () =>
  expectSaga(saga)
    .provide([[m.flush(fakeChannel), 'flushed'], actionChannelProvider])
    .put({ type: 'DONE', payload: 'flushed' })
    .run());

test('uses dynamic values for static providers', () =>
  expectSaga(saga)
    .provide([
      [m.flush(fakeChannel), dynamic(() => 'flushed')],
      actionChannelProvider,
    ])
    .put({ type: 'DONE', payload: 'flushed' })
    .run());

test('dynamic values have access to channel', () =>
  expectSaga(saga)
    .provide([
      [
        m.flush(fakeChannel),
        dynamic(channel => {
          expect(channel).toBe(fakeChannel);
          return 'flushed';
        }),
      ],

      actionChannelProvider,
    ])
    .put({ type: 'DONE', payload: 'flushed' })
    .run());
