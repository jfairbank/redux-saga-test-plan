// @flow
import { apply, put } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

const context = {};
const apiFunction = () => 0;
const otherContext = {};
const otherApiFunction = () => 1;

function* saga() {
  const value = yield apply(context, apiFunction, [21]);
  const otherValue = yield apply(otherContext, otherApiFunction);
  yield put({ type: 'DONE', payload: value + otherValue });
}

test('uses provided value for `apply` via `call`', () =>
  expectSaga(saga)
    .provide({
      call({ fn, context: ctx, args: [arg] }, next) {
        if (ctx === context && fn === apiFunction) {
          return arg * 2;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses static provided values from redux-saga/effects', () =>
  expectSaga(saga)
    .provide([[apply(context, apiFunction, [21]), 42]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses static provided values from matchers', () =>
  expectSaga(saga)
    .provide([[m.apply(context, apiFunction, [21]), 42]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses partial static provided values from matchers', () =>
  expectSaga(saga)
    .provide([[m.apply.fn(apiFunction), 42]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('uses dynamic values for static providers', () =>
  expectSaga(saga)
    .provide([[m.apply.fn(apiFunction), dynamic(() => 42)]])
    .put({ type: 'DONE', payload: 43 })
    .run());

test('dynamic values have access to effect', () =>
  expectSaga(saga)
    .provide([[m.apply.fn(apiFunction), dynamic(effect => effect.args[0] * 3)]])
    .put({ type: 'DONE', payload: 64 })
    .run());
