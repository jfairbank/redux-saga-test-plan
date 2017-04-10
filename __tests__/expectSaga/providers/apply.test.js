// @flow
import { apply, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

test('uses provided value for `apply` via `call`', () => {
  const context = {};
  const apiFunction = () => 0;
  const otherContext = {};
  const otherApiFunction = () => 1;

  function* saga() {
    const value = yield apply(context, apiFunction, [21]);
    const otherValue = yield apply(otherContext, otherApiFunction);
    yield put({ type: 'DONE', payload: value + otherValue });
  }

  return expectSaga(saga)
    .provide({
      call({ fn, context: ctx, args: [arg] }, next) {
        if (ctx === context && fn === apiFunction) {
          return arg * 2;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .run();
});
