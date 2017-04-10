// @flow
import { call, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

test('handles errors', () => {
  const errorFunction = () => 0;
  const error = new Error('Whoops...');

  function* saga() {
    try {
      yield call(errorFunction);
    } catch (e) {
      yield put({ type: 'DONE', payload: e });
    }
  }

  return expectSaga(saga)
    .provide({
      call({ fn }) {
        if (fn === errorFunction) {
          throw error;
        }
      },
    })
    .put({ type: 'DONE', payload: error })
    .run();
});
