// @flow
import { call, put, take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { NEXT, handlers } from '../../../src/expectSaga/provideValue';
import { PARALLEL } from '../../../src/shared/keys';
import * as m from '../../../src/expectSaga/matchers';
import { dynamic } from '../../../src/expectSaga/providers';

const apiFunction = () => 0;

function* saga() {
  const [x, { payload: y }] = yield [
    call(apiFunction),
    take('Y'),
  ];

  yield put({ type: 'DONE', payload: x + y });
}

test('uses provided value for `parallel`', () => (
  expectSaga(saga)
    .provide({
      parallel: () => [
        20,
        { type: 'Y', payload: 22 },
      ],
    })
    .put({ type: 'DONE', payload: 42 })
    .run()
));

test('inner providers for `parallel` work', () => (
  expectSaga(saga)
    .provide({
      call: () => 20,
      take: () => ({ type: 'Y', payload: 22 }),
    })
    .put({ type: 'DONE', payload: 42 })
    .run()
));

test('inner static providers from redux-saga/effects for `parallel` work', () => (
  expectSaga(saga)
    .provide([
      [call(apiFunction), 20],
      [take('Y'), { type: 'Y', payload: 22 }],
    ])
    .put({ type: 'DONE', payload: 42 })
    .run()
));

test('inner static providers from matchers for `parallel` work', () => (
  expectSaga(saga)
    .provide([
      [m.call(apiFunction), 20],
      [m.take('Y'), { type: 'Y', payload: 22 }],
    ])
    .put({ type: 'DONE', payload: 42 })
    .run()
));

test('inner static providers use dynamic values for static providers', () => (
  expectSaga(saga)
    .provide([
      [m.call(apiFunction), dynamic(() => 20)],
      [m.take('Y'), dynamic(() => ({ type: 'Y', payload: 22 }))],
    ])
    .put({ type: 'DONE', payload: 42 })
    .run()
));

test('inner static providers dynamic values have access to effect', () => (
  expectSaga(saga)
    .provide([
      [m.call(apiFunction), dynamic(({ fn }) => {
        expect(fn).toBe(apiFunction);
        return 20;
      })],

      [m.take('Y'), dynamic(({ pattern }) => {
        expect(pattern).toBe('Y');
        return { type: 'Y', payload: 22 };
      })],
    ])
    .put({ type: 'DONE', payload: 42 })
    .run()
));

test('test coverage for PARALLEL handler', () => {
  const actual = handlers[PARALLEL]({}, {});
  expect(actual).toBe(NEXT);
});
