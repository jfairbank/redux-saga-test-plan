// @flow
import { cps, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

test('uses provided value for `cps`', () => {
  const handler = (cb) => cb(null, 1);
  const otherHandler = () => 0;

  function* saga() {
    const value = yield cps(handler);
    const otherValue = yield cps(otherHandler, 21);

    yield put({ type: 'DONE', payload: value + otherValue });
  }

  return expectSaga(saga)
    .provide({
      cps({ fn, args: [value] }, next) {
        if (fn === otherHandler) {
          return value * 2;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 43 })
    .run();
});
