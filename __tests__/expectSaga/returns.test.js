/* eslint-disable require-yield */
import { call, put } from 'redux-saga/effects';
import expectSaga from '../../src/expectSaga';

test('returns values from other sagas', () => {
  function* anotherSaga() {
    return { hello: 'world' };
  }

  function* otherSaga() {
    return yield call(anotherSaga);
  }

  function* saga() {
    const result = yield call(otherSaga);
    yield put({ type: 'RESULT', payload: result });
  }

  return expectSaga(saga)
    .put({ type: 'RESULT', payload: { hello: 'world' } })
    .run();
});
