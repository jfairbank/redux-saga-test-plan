// @flow
import { call, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

const apiFunction = () => 0;
const otherApiFunction = () => 1;

function* saga() {
  const value = yield call(apiFunction, 21);
  const otherValue = yield call(otherApiFunction);
  yield put({ type: 'DONE', payload: value + otherValue });
}

test('test coverage for invalid matcher', () => (
  expectSaga(saga)
    .provide([
      [{}, 'n/a'],
      [call(apiFunction, 21), 42],
    ])
    .put({ type: 'DONE', payload: 43 })
    .run()
));
