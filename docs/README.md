# Redux Saga Test Plan

[![npm](https://img.shields.io/npm/v/redux-saga-test-plan.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga-test-plan)
[![Travis branch](https://img.shields.io/travis/jfairbank/redux-saga-test-plan/master.svg?style=flat-square)](https://travis-ci.org/jfairbank/redux-saga-test-plan)
[![Codecov](https://img.shields.io/codecov/c/github/jfairbank/redux-saga-test-plan.svg?style=flat-square)](https://codecov.io/gh/jfairbank/redux-saga-test-plan)

#### Powerful test helpers for Redux Saga.

Redux Saga Test Plan makes testing sagas a breeze. Whether you need to test
exact effects and their ordering or just test your saga `put`'s a specific
action at some point, Redux Saga Test Plan has you covered.

Redux Saga Test Plan aims to embrace both unit testing and integration testing
approaches to make testing your sagas easy.

## Unit Testing

If you want to ensure that your saga yields specific types of effects in a
particular order, then you'll want to use the `testSaga` function. Here's a
simple example

```js
// ES2015
import { testSaga } from 'redux-saga-test-plan';

// ES5/CJS
var testSaga = require('redux-saga-test-plan').testSaga;

function identity(value) {
  return value;
}

function* mainSaga(x, y) {
  const action = yield take('HELLO');

  yield put({ type: 'ADD', payload: x + y });
  yield call(identity, action);
}

const action = { type: 'TEST' };

// create saga mock             x   y
const saga = testSaga(mainSaga, 40, 2);

saga
  // advance saga with `next()`
  .next()

  // assert that the saga yields `take` with `'HELLO'` as type
  .take('HELLO')

  // pass back in a value to a saga after it yields
  .next(action)

  // assert that the saga yields `put` with the expected action
  .put({ type: 'ADD', payload: 42 })

  .next()

  // assert that the saga yields a `call` to `identity` with
  // the `action` argument
  .call(identity, action)

  .next()

  // assert that the saga is finished
  .isDone();
```

## Integration Testing

One downside to unit testing is that it couples your test to your
implementation. Simple reordering of yielded effects in your saga could break
your tests even if the functionality stays the same. If you're not concerned
with the order or exact effects your saga yields, then you can take a
integration testing approach, whereby your saga is actually run by Redux Saga.
Then, you can simply test that a particular effect was yielded during the saga
run. For this, use the `expectSaga` test function.

```js
// ES2015
import { expectSaga } from 'redux-saga-test-plan';

// ES5/CJS
var expectSaga = require('redux-saga-test-plan').expectSaga;

function identity(value) {
  return value;
}

function* mainSaga(x, y) {
  const action = yield take('HELLO');

  yield put({ type: 'ADD', payload: x + y });
  yield call(identity, action);
}

// create saga mock               x   y
const saga = expectSaga(mainSaga, 40, 2);

saga
  // assert that the saga will eventually yield `put`
  // with the expected action
  .put({ type: 'ADD', payload: 42 })

  // start Redux Saga up with the saga
  .start()

  // dispatch any actions your saga will `take`
  .dispatch({ type: 'HELLO' })

  // stop the saga
  .stop();
```

## Table of Contents

- [Introduction](/README.md)
- [Getting Started](/getting-started.md)
- [Unit Testing](/unit-testing/README.md)
  - [Error Messages](/unit-testing/error-messages.md)
  - [Effect Creators](/unit-testing/effect-creators.md)
  - [Saga Helpers](/unit-testing/saga-helpers.md)
  - [General Assertions](/unit-testing/general-assertions.md)
  - [Time Travel](/unit-testing/time-travel.md)
- [Integration Testing](/integration-testing/README.md)

## REINTEGRATE BELOW

## Effect Creators

As mentioned, Redux Saga Test Plan has assertions for all the effect creators
available in Redux Saga. You can reference them in Redux Saga's docs
[here](http://redux-saga.github.io/redux-saga/docs/api/index.html#effect-creators).

- `take(pattern)`
- `take.maybe(pattern)`
- `take(channel)`
- `take.maybe(channel)`
- `put(action)`
- `put.resolve(action)`
- `put(channel, action)`
- `call(fn, ...args)`
- `call([context, fn], ...args)`
- `apply(context, fn, args)`
- `cps(fn, ...args)`
- `cps([context, fn], ...args)`
- `fork(fn, ...args)`
- `fork([context, fn], ...args)`
- `spawn(fn, ...args)`
- `spawn([context, fn], ...args)`
- `join(task)`
- `cancel(task)`
- `select(selector, ...args)`
- `actionChannel(pattern, [buffer])`
- `flush(channel)`
- `cancelled()`
- `takem(pattern)` **DEPRECATED:** Use `take.maybe`
- `takem(channel)` **DEPRECATED:** Use `take.maybe`

## Saga Helpers

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
