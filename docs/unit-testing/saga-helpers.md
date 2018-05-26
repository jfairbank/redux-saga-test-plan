# Saga Helpers

Redux Saga Test Plan also offers assertions for the saga helper effects
`takeEvery`, `takeLatest`, `takeLeading`, and `throttle`.

```js
import { call, takeEvery } from 'redux-saga/effects';
import testSaga from 'redux-saga-test-plan';

function identity(value) {
  return value;
}

function* otherSaga(action, value) {
  yield call(identity, value);
}

function* anotherSaga(action) {
  yield call(identity, action.payload);
}

function* mainSaga() {
  yield call(identity, 'foo');
  yield takeEvery('READY', otherSaga, 42);
}

// All good
testSaga(mainSaga)
  .next()
  .call(identity, 'foo')

  .next()
  .takeEvery('READY', otherSaga, 42)

  .finish()
  .isDone();

// Will throw
testSaga(mainSaga)
  .next()
  .call(identity, 'foo')

  .next()
  .takeEvery('READY', anotherSaga, 42)

  .finish()
  .isDone();

// SagaTestError:
// Assertion 2 failed: expected takeEvery effect, but the saga yielded a different effect
//
// Expected
// --------
// { FORK:
//    { context: null,
//      fn: [Function: takeEvery],
//      args: [ 'READY', [Function: anotherSaga], 42 ] } }
//
// Actual
// ------
// { FORK:
//    { context: null,
//      fn: [Function: takeEvery],
//      args: [ 'READY', [Function: otherSaga], 42 ] } }
```
