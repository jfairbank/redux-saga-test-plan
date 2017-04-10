// @flow
import { call, put, take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { NEXT, handlers } from '../../../src/expectSaga/provideValue';
import { PARALLEL } from '../../../src/shared/keys';

test('uses provided value for `parallel`', () => {
  const apiFunction = () => 0;

  function* saga() {
    const [x, { payload: y }] = yield [
      call(apiFunction),
      take('Y'),
    ];

    yield put({ type: 'DONE', payload: x + y });
  }

  return expectSaga(saga)
    .provide({
      parallel: () => [
        20,
        { type: 'Y', payload: 22 },
      ],
    })
    .put({ type: 'DONE', payload: 42 })
    .run();
});

test('inner providers for `parallel` work', () => {
  const apiFunction = () => 0;

  function* saga() {
    const [x, { payload: y }] = yield [
      call(apiFunction),
      take('Y'),
    ];

    yield put({ type: 'DONE', payload: x + y });
  }

  return expectSaga(saga)
    .provide({
      call: () => 20,
      take: () => ({ type: 'Y', payload: 22 }),
    })
    .put({ type: 'DONE', payload: 42 })
    .run();
});

test('test coverage for PARALLEL handler', () => {
  const actual = handlers[PARALLEL]({}, {});
  expect(actual).toBe(NEXT);
});
