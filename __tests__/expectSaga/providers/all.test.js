// @flow
import { all, call, put, take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { NEXT, handlers } from 'expectSaga/provideValue';
import { ALL } from 'shared/keys';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

const apiFunction = () => 0;

function* sagaWithArray() {
  const [x, { payload: y }] = yield all([
    call(apiFunction),
    take('Y'),
  ]);

  yield put({ type: 'DONE', payload: x + y });
}

function* sagaWithObject() {
  const { foo: x, bar: { payload: y } } = yield all({
    foo: call(apiFunction),
    bar: take('Y'),
  });

  yield put({ type: 'DONE', payload: x + y });
}

[
  ['array', sagaWithArray],
  ['object', sagaWithObject],
].forEach(([type, saga]) => {
  describe(`with ${type}`, () => {
    test('inner providers for `all` work', () => (
      expectSaga(saga)
        .provide({
          call: () => 20,
          take: () => ({ type: 'Y', payload: 22 }),
        })
        .put({ type: 'DONE', payload: 42 })
        .run()
    ));

    test('inner static providers from redux-saga/effects for `all` work', () => (
      expectSaga(saga)
        .provide([
          [call(apiFunction), 20],
          [take('Y'), { type: 'Y', payload: 22 }],
        ])
        .put({ type: 'DONE', payload: 42 })
        .run()
    ));

    test('inner static providers from matchers for `all` work', () => (
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
  });
});

test('test coverage for ALL handler', () => {
  const actual = handlers[ALL]({}, {});
  expect(actual).toBe(NEXT);
});
