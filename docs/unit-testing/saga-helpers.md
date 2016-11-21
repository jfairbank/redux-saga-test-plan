# Saga Helpers

Redux Saga Test Plan also offers assertions for the saga helper functions
`takeEvery`, `takeLatest`, and `throttle` (available starting in Redux Saga
v0.12.0), depending on how you use them:

1. If your saga delegates to any of these helpers (i.e. uses `yield*`), then you
   can use the respective `takeEvery`, `takeLatest`, and `throttle` methods from
   Redux Saga Test Plan. The difference between these assertions and the normal
   effect creator assertions is that you shouldn't call `next` on your test saga
   beforehand. These methods will automatically advance the saga for you. You
   can read more about `takeEvery`, `takeLatest`, and `throttle` in Redux Saga's
   docs
   [here](http://yelouafi.github.io/redux-saga/docs/api/index.html#saga-helpers).

2. Starting in Redux Saga v0.12.0, instead of delegating to these helpers, you
   can instead yield them like normal effect creators such as `call` or `put`.
   These are non-blocking yields; internally, Redux Saga will fork them like the
   normal `fork` effect creator. If you yield instead of delegating, then you
   can use the respective `takeEveryFork`, `takeLatestFork`, and `throttleFork`
   methods from Redux Saga Test Plan. Because these assertions are like the
   normal effect creator assertions, you **WILL** need to call `next` prior to
   these assertions.


#### Summary

| Helper | Delegating | Yielding |
| ------ | ---------- | -------- |
| `takeEvery` | Use `takeEvery` assertion.<br>Don't call `next` before. | Use `takeEveryFork` assertion.<br>Call `next` before. |
| `takeLatest` | Use `takeLatest` assertion.<br>Don't call `next` before. | Use `takeLatestFork` assertion.<br>Call `next` before. |
| `throttle` | Use `throttle` assertion.<br>Don't call `next` before. | Use `throttleFork` assertion.<br>Call `next` before. |

#### Delegating Example

```js
import { takeEvery } from 'redux-saga';
import { call } from 'redux-saga/effects';
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
  yield* takeEvery('READY', otherSaga, 42);
}

// All good
testSaga(mainSaga)
  .next()
  .call(identity, 'foo')
  .takeEvery('READY', otherSaga, 42)
  .finish()
  .isDone();

// Will throw
testSaga(mainSaga)
  .next()
  .call(identity, 'foo')
  .takeEvery('READY', anotherSaga, 42)
  .finish()
  .isDone();

// SagaTestError:
// Assertion 2 failed: expected takeEvery to fork anotherSaga
//
// Expected
// --------
// [Function: anotherSaga]
//
// Actual
// ------
// [Function: otherSaga]
```

#### Yielding Example

```js
import { takeEvery } from 'redux-saga';
import { call } from 'redux-saga/effects';
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
  .takeEveryFork('READY', otherSaga, 42)

  .finish()
  .isDone();

// Will throw
testSaga(mainSaga)
  .next()
  .call(identity, 'foo')

  .next()
  .takeEveryFork('READY', anotherSaga, 42)

  .finish()
  .isDone();

// SagaTestError:
// Assertion 2 failed: expected takeEvery to fork anotherSaga
//
// Expected
// --------
// [Function: anotherSaga]
//
// Actual
// ------
// [Function: otherSaga]
```
