import { put, select } from 'redux-saga/effects';
import expectSaga from 'expectSaga';

const selector = state => state.test;

function* mainSaga() {
  function* innerSaga() {
    const result = yield select(selector);
    return result;
  }

  const result = yield innerSaga();

  if (result) {
    yield put({ type: 'DATA', payload: 42 });
  }
}

test('provides value for yielded iterators', () =>
  expectSaga(mainSaga)
    .provide([[select(selector), true]])
    .put({ type: 'DATA', payload: 42 })
    .run());
