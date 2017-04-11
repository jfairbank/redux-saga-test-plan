// @flow
import { cancelled, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import * as m from '../../../src/expectSaga/matchers';
import { dynamic } from '../../../src/expectSaga/providers';

function* saga() {
  if (yield cancelled()) {
    yield put({ type: 'CANCELLED' });
  } else {
    yield put({ type: 'NOT_CANCELLED' });
  }
}

test('uses provided value for `cancelled`', () => (
  expectSaga(saga)
    .provide({
      cancelled: () => true,
    })
    .put({ type: 'CANCELLED' })
    .run()
));

test('uses static provided values from redux-saga/effects', () => (
  expectSaga(saga)
    .provide([
      [cancelled(), true],
    ])
    .put({ type: 'CANCELLED' })
    .run()
));

test('uses static provided values from matchers', () => (
  expectSaga(saga)
    .provide([
      [m.cancelled(), true],
    ])
    .put({ type: 'CANCELLED' })
    .run()
));

test('uses dynamic values for static providers', () => (
  expectSaga(saga)
    .provide([
      [m.cancelled(), dynamic(() => true)],
    ])
    .put({ type: 'CANCELLED' })
    .run()
));
