// @flow
import { actionChannel, put, take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

const fakeChannel = {
  take() {},
  close() {},
};

function* saga() {
  const channel = yield actionChannel('FOO');
  const otherChannel = yield actionChannel('BAR');

  const [action, otherAction] = yield [take(channel), take(otherChannel)];

  const payload = action.payload + otherAction.payload;

  yield put({ payload, type: 'DONE' });
}

const takeProvider = {
  take({ channel }, next) {
    if (channel === fakeChannel) {
      return { type: 'HELLO', payload: 40 };
    }

    if (channel) {
      return { type: 'WORLD', payload: 2 };
    }

    return next();
  },
};

test('uses provided value for `actionChannel`', () =>
  expectSaga(saga)
    .provide({
      actionChannel({ pattern }, next) {
        if (pattern === 'FOO') {
          return fakeChannel;
        }

        return next();
      },

      take: takeProvider.take,
    })
    .put({ type: 'DONE', payload: 42 })
    .run());

test('uses static provided values from redux-saga/effects', () =>
  expectSaga(saga)
    .provide([[actionChannel('FOO'), fakeChannel], takeProvider])
    .put({ type: 'DONE', payload: 42 })
    .run());

test('uses static provided values from matchers', () =>
  expectSaga(saga)
    .provide([[m.actionChannel('FOO'), fakeChannel], takeProvider])
    .put({ type: 'DONE', payload: 42 })
    .run());

test('uses partial static provided values from matchers', () =>
  expectSaga(saga)
    .provide([[m.actionChannel.pattern('FOO'), fakeChannel], takeProvider])
    .put({ type: 'DONE', payload: 42 })
    .run());

test('uses dynamic values for static providers', () =>
  expectSaga(saga)
    .provide([
      [m.actionChannel('FOO'), dynamic(() => fakeChannel)],
      takeProvider,
    ])
    .put({ type: 'DONE', payload: 42 })
    .run());

test('dynamic values have access to effect', () =>
  expectSaga(saga)
    .provide([
      [
        m.actionChannel('FOO'),
        dynamic(effect => {
          expect(effect.pattern).toBe('FOO');
          return fakeChannel;
        }),
      ],

      takeProvider,
    ])
    .put({ type: 'DONE', payload: 42 })
    .run());
