// @flow
import { call, put } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { dynamic, throwError } from 'expectSaga/providers';

const errorFunction = () => 0;
const error = new Error('Whoops...');

function* saga() {
  try {
    yield call(errorFunction);
  } catch (e) {
    yield put({ type: 'DONE', payload: e });
  }
}

test('handles errors', () => (
  expectSaga(saga)
    .provide({
      call({ fn }) {
        if (fn === errorFunction) {
          throw error;
        }
      },
    })
    .put({ type: 'DONE', payload: error })
    .run()
));

test('handles dynamically thrown errors', () => (
  expectSaga(saga)
    .provide([
      [
        call(errorFunction),
        dynamic(() => { throw error; }),
      ],
    ])
    .put({ type: 'DONE', payload: error })
    .run()
));

test('handles statically provided errors', () => (
  expectSaga(saga)
    .provide([
      [call(errorFunction), throwError(error)],
    ])
    .put({ type: 'DONE', payload: error })
    .run()
));
