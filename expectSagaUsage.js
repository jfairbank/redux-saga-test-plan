// import { takeEvery } from 'redux-saga';
import { call, fork, put, select, take } from 'redux-saga/effects';
// import { call, put, select, take } from 'redux-saga/effects';
import { expectSaga } from './src';
import { delay } from './src/utils/async';

function* someOtherSaga() {
  const log = (...args) => console.log('someOtherSaga:', ...args);

  while (true) {
    yield take('BLAH');
    yield put({ type: 'BLAH_RCV' });
    yield delay(250);
    log('sent a BLAH');
  }
}

function* backgroundSaga() {
  console.log('before delay');
  // yield delay(500);
  console.log('after delay');

  yield put({ type: 'BACKGROUND' });
  console.log('put BACKGROUND');
  yield take('FOO');
  console.log('take FOO');
  yield put({ type: 'BAR' });
  console.log('put BAR');

  yield fork(someOtherSaga);
}

function* mainSaga(selectors, api) {
  yield take('READY');

  const [a, b, data] = yield [
    select(selectors.getA),
    select(selectors.getB),
    call(api.fetchData),
  ];

  yield [
    put({ type: 'RESULT', payload: a + b }),
    put({ type: 'DATA', payload: data }),
  ];

  // yield takeEvery('TEST', backgroundSaga);
  yield fork(backgroundSaga);
}

const selectors = {
  getA: () => 40,
  getB: () => 2,
  getC: () => 13,
};

const expectedData = { foo: 'bar' };

const api = {
  fetchData: () => Promise.resolve(expectedData),
};

expectSaga(mainSaga, selectors, api)
  .put({ type: 'DATA', payload: expectedData })
  .put({ type: 'RESULT', payload: 42 })
  .put({ type: 'BAR' })
  .put({ type: 'BACKGROUND' })
  .put({ type: 'BLAH_RCV' })

  .start()
  .dispatch({ type: 'READY' })
  .dispatch({ type: 'TEST' })
  .dispatch({ type: 'FOO' })
  .dispatch({ type: 'BLAH' })
  .stop();
