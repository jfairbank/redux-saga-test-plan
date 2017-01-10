# Saga Helpers

Redux Saga Test Plan also offers assertions for the saga helper effects
`takeEvery`, `takeLatest`, and `throttle`. These helpers come in two flavors.
Your sagas can delegate (i.e. use `yield*`) to these helpers if you import them
directly from the `redux-saga` module. This is now a deprecated pattern
according to Redux Saga. You are encouraged to now import the equivalent effect
creators for these helpers from the `redux-saga/effects` module and just yield
them like other effect creators. Redux Saga still supports delegating to the
helpers, but if it removes support for delegation, then Redux Saga Test Plan
will also necessarily remove support for testing delegations.

To decide which assertions you need for testing your saga, please review the
possibilities below:

1. If you are using the helper effect creators from `redux-saga/effects`, you
   can use the respective methods `takeEveryEffect`, `takeLatestEffect`, and
   `throttleEffect` from Redux Saga Test Plan.

2. If your saga delegates to any of these helpers from `redux-saga` directly,
   then you can use the respective `takeEvery`, `takeLatest`, and `throttle`
   methods from Redux Saga Test Plan. The difference between these assertions
   and the normal effect creator assertions is that you shouldn't call `next` on
   your test saga beforehand. These methods will automatically advance the saga
   for you.

   **DEPRECATION NOTICE**:  
   Delegating is now a deprecated pattern for Redux Saga. Please move to using
   the effect creators added in Redux Saga
   [v0.14.0](https://github.com/redux-saga/redux-saga/releases/tag/v0.14.0).
   If Redux Saga removes this pattern, then Redux Saga Test Plan will also
   remove the respective assertion methods.

3. Starting in Redux Saga
   [v0.12.0](https://github.com/redux-saga/redux-saga/releases/tag/v0.12.0),
   instead of delegating to the helpers from the `redux-saga` module, you could
   instead yield them like normal effect creators such as `call` or `put`. These
   are non-blocking yields; internally, Redux Saga will fork them like the
   normal `fork` effect creator. If you yield instead of delegating, then you
   can use the respective `takeEveryFork`, `takeLatestFork`, and `throttleFork`
   methods from Redux Saga Test Plan. Because these assertions are like the
   normal effect creator assertions, you **WILL** need to call `next` prior to
   these assertions.

   **DEPRECATION NOTICE**:  
   Because these are the same helpers you can delegate to, this pattern may also
   be removed by Redux Saga, meaning Redux Saga Test Plan will also remove the
   respective assertion methods.

#### Summary

| Helper | Effect Creator | Delegating Helper<br>DEPRECATED | Yielding Helper<br>DEPRECATED |
| ------ | -------------- | ----------------- | --------------- |
| `takeEvery` | Use `takeEveryEffect` assertion.<br>Call `next` before. | Use `takeEvery` assertion.<br>Don't call `next` before. | Use `takeEveryFork` assertion.<br>Call `next` before. |
| `takeLatest` | Use `takeLatestEveryEffect` assertion.<br>Call `next` before. | Use `takeLatest` assertion.<br>Don't call `next` before. | Use `takeLatestFork` assertion.<br>Call `next` before. |
| `throttle` | Use `throttleEffect` assertion.<br>Call `next` before. | Use `throttle` assertion.<br>Don't call `next` before. | Use `throttleFork` assertion.<br>Call `next` before. |

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
