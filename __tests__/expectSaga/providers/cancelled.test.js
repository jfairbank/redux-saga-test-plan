// @flow
import { cancelled, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

test('uses provided value for `cancelled`', () => {
  function* saga() {
    if (yield cancelled()) {
      yield put({ type: 'CANCELLED' });
    } else {
      yield put({ type: 'NOT_CANCELLED' });
    }
  }

  return expectSaga(saga)
    .provide({
      cancelled: () => true,
    })
    .put({ type: 'CANCELLED' })
    .run();
});
