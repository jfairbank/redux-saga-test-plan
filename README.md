# Redux Saga Test Plan

[![Travis branch](https://img.shields.io/travis/jfairbank/redux-saga-test-plan/master.svg?style=flat-square)](https://travis-ci.org/jfairbank/redux-saga-test-plan)
[![npm](https://img.shields.io/npm/v/redux-saga-test-plan.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga-test-plan)

Powerful test helpers for Redux Saga.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Error Messages](#error-messages)
- [Effect Creators](#effect-creators)
- [Saga Helpers](#saga-helpers)
- [General Assertions](#general-assertions)
- [Time Travel](#time-travel)

## Install

    $ npm install --save-dev redux-saga-test-plan

## Usage

Redux Saga Test Plan makes testing sagas a breeze.

Redux Saga Test Plan exports a `testSaga` function that creates a mock saga for
you to assert effects on. `testSaga` is agnostic about your testing framework,
so it simply throws if the sequence of yielded effects don't match your
assertion effects.

Pass in your generator function as the first argument. Pass in additional
arguments which will be the arguments passed on to the generator function.

```js
// ES2015
import testSaga from 'redux-saga-test-plan';

// ES5
var testSaga = require('redux-saga-test-plan').testSaga;

function identity(value) {
  return value;
}

function* otherSaga() {}

function* mainSaga(x, y, z) {
  try {
    const action = yield take('HELLO');
    yield put({ type: 'ADD', payload: x + y });
    yield call(identity, action);
    yield fork(otherSaga, z);
  } catch (e) {
    yield put({ type: 'ERROR', payload: e });
  }
}

const action = { type: 'TEST' };

// saga mock                    x   y  z
const saga = testSaga(mainSaga, 40, 2, 20);
```

The saga mock has `next` and `throw` iterator methods, so you can advance
through the saga. Pass in arguments to `next` to simulate response values from
`yields`. Similarly pass in arguments to `throw` to specify the thrown error.

Each `next` and `throw` call returns an API with effect assertions. All Redux
Saga effects are available such as `call`, `put`, `take`, `fork`, etc. An
additional effect called `isDone` allows you to assert that the generator as
reached the end.

```js
function identity(value) {
  return value;
}

function* otherSaga() {}

function* mainSaga(x, y, z) {
  try {
    const action = yield take('HELLO');
    yield put({ type: 'ADD', payload: x + y });
    yield call(identity, action);
    yield fork(otherSaga, z);
  } catch (e) {
    yield put({ type: 'ERROR', payload: e });
  }
}

const action = { type: 'TEST' };

let saga = testSaga(mainSaga, 40, 2, 20);

// try path
saga.next().take('HELLO');
saga.next(action).put({ type: 'ADD', payload: 42 });
saga.next().call(identity, action);
saga.next().fork(otherSaga);
saga.next().isDone();

// Or chain together
saga = testSaga(mainSaga, 40, 2, 20);
saga
  .next()
  .take('HELLO')

  .next(action)
  .put({ type: 'ADD', payload: 42 })

  .next()
  .call(identity, action)

  .next()
  .fork(otherSaga)

  .next()
  .isDone();

// catch path
const error = new Error('My Error');
saga = testSaga(mainSaga, 40, 2, 20);
saga
  .next()

  .throw(error)
  .put({ type: 'ERROR', payload: error })

  .next()
  .isDone();
```

## Error Messages

If a yielded effect and assertion effect call don't match, then the mock saga
will throw an error showing the difference between the two.

```js
function identity(value) {
  return value;
}

function* otherSaga() {}

function* mainSaga(x, y, z) {
  try {
    const action = yield take('HELLO');
    yield put({ type: 'ADD', payload: x + y });
    yield call(identity, action);
    yield fork(otherSaga, z);
  } catch (e) {
    yield put({ type: 'ERROR', payload: e });
  }
}

const action = { type: 'TEST' };

let saga = testSaga(mainSaga, 40, 2, 20);

saga.next().take('HI');

// Throws with below:
//
// SagaTestError:
// Assertion 1 failed: take effects do not match
// 
// Expected
// --------
// { channel: null, pattern: 'HI' }
// 
// Actual
// ------
// { channel: null, pattern: 'HELLO' }

saga = testSaga(mainSaga, 40, 2, 20);
saga
  .next()
  .take('HELLO')

  .next(action)
  .put({ type: 'ADD', payload: 43 });

// Throws with below:
//
// SagaTestError:
// Assertion 2 failed: put effects do not match
// 
// Expected
// --------
// { channel: null, action: { type: 'ADD', payload: 43 } }
// 
// Actual
// ------
// { channel: null, action: { type: 'ADD', payload: 42 } }
```

If the yielded effect and asserted effect are different types of effects, then
the saga will throw an error with a message showing the difference.

```js
function identity(value) {
  return value;
}

function* otherSaga() {}

function* mainSaga(x, y, z) {
  try {
    const action = yield take('HELLO');
    yield put({ type: 'ADD', payload: x + y });
    yield call(identity, action);
    yield fork(otherSaga, z);
  } catch (e) {
    yield put({ type: 'ERROR', payload: e });
  }
}

const action = { type: 'TEST' };

const saga = testSaga(mainSaga, 40, 2, 20);

saga
  .next()
  .take('HELLO')

  .next(action)
  .take('WORLD');

// SagaTestError:
// Assertion 2 Failed: expected take effect, but the saga yielded a different effect
// 
// Expected
// --------
// { '@@redux-saga/IO': true,
//   TAKE: { channel: null, pattern: 'WORLD' } }
// 
// Actual
// ------
// { '@@redux-saga/IO': true,
//   PUT: { channel: null, action: { type: 'ADD', payload: 42 } } }
```

## Effect Creators

As mentioned, Redux Saga Test Plan has assertions for all the effect creators
available in Redux Saga. You can reference them in Redux Saga's docs
[here](http://yelouafi.github.io/redux-saga/docs/api/index.html#effect-creators).

- `take(pattern)`
- `takem(pattern)`
- `take(channel)`
- `takem(channel)`
- `put(action)`
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
- `flush(channel)` - Starting in Redux Saga v0.12.0
- `cancelled()`

## Saga Helpers

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

## General Assertions

Other general assertions available are `is`, `parallel`, `isDone`, and
`returns`.

| Assertion  | Description                             |
| ---------- | --------------------------------------- |
| `is`       | General purpose deep equal assertion    |
| `parallel` | Parallel effects assertion              |
| `isDone`   | Assert at end of saga                   |
| `returns`  | Assert saga returns a value and is done |

```js
import { take } from 'redux-saga/effects';

function* mainSaga() {
  yield [
    take('HELLO'),
    take('WORLD'),
  ];

  yield 42;
  yield { foo: { bar: 'baz' } };
}

let saga = testSaga(mainSaga);

saga
  .next()
  .parallel([
    take('HELLO'),
    take('WORLD'),
  ])

  .next()
  .is(42)
  
  .next()
  .is({ foo: { bar: 'baz' } })
  
  .next()
  .isDone();
```

```js
function* otherSaga(x) {
  return x * 2;
}

const saga = testSaga(otherSaga, 21);

saga
  .next()
  .returns(42);
```

## Time Travel

The mock saga can also time travel through the saga generator.

| Method                         | Description                                            |
| ------------------------------ | ------------------------------------------------------ |
| `back(n?: number)`             | Back up a number of steps in the saga (defaults to 1)  |
| `restart(...args: Array<any>)` | Restart the saga from the beginning                    |
| `finish(arg?: any)`            | Finish a saga early by forcing a return                |
| `save(label: string)`          | Save a point in history with a label                   |
| `restore(label: string)`       | Restore a point in history (label must be saved prior) |

### Go Back or Restart

For simple time travel, the mock saga includes `back` and `restart` methods
which allow you to back up some number of steps or completely restart the saga.
This is useful for handling multiple control flow branches such as `if/else` and
`try/catch`.

`back` takes an optional number argument to specify the number of steps to back
up. It defaults to 1.

As its name suggestions, `restart` will restart your saga. If your saga takes
arguments, then you can restart with new arguments by passing them in to
`restart`. If you don't supply any arguments, then it will restart with whatever
original arguments you used.

```js
function getPredicate() {}

function* mainSaga(x) {
  try {
    const predicate = yield select(getPredicate);

    if (predicate) {
      yield take('TRUE');
    } else {
      yield take('FALSE');
    }

    yield put({ type: 'DONE', payload: x });
  } catch (e) {
    yield take('ERROR');
  }
}

let saga = testSaga(mainSaga, 42);

// Back up one step by default
saga
  .next()
  .select(getPredicate)

  .back()
  .next()
  .select(getPredicate);

// Back up `2` steps to try `else` branch
saga = testSaga(mainSaga, 42);
saga
  .next()
  .select(getPredicate)

  .next(true)
  .take('TRUE')

  .next()
  .isDone()

  .back(2)
  .next(false)
  .take('FALSE')

  .next()
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone();

// Restart from the beginning to throw
const error = new Error('My Error');
saga = testSaga(mainSaga, 42);

saga
  .next()
  .select(getPredicate)

  .next(true)
  .take('TRUE')

  .next()
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone()

  .restart()
  .next()
  .throw(error)
  .take('ERROR')

  .next()
  .isDone();

// Restart to update the argument
saga = testSaga(mainSaga, 42);

saga
  .next()
  .select(getPredicate)

  .next(true)
  .take('TRUE')

  .next()
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone()

  .restart('hello world')
  .next()
  .select(getPredicate)

  .next(true)
  .take('TRUE')

  .next()
  .put({ type: 'DONE', payload: 'hello world' })

  .next()
  .isDone();
```

### Finish Early

If you want to finish a saga early like bailing out of a `while` loop, then you
can use the `finish` method.

```js
function identity(value) {
  return value;
}

function* loopingSaga() {
  while (true) {
    const action = yield take('HELLO');
    yield call(identity, action);
  }
}

let saga = testSaga(loopingSaga);

saga
  .next()

  .take('HELLO')
  .next(action)
  .call(identity, action)
  .next()

  .take('HELLO')
  .next(action)
  .call(identity, action)
  .next()

  .finish()
  .next()
  .isDone();

// With argument(s)

saga = testSaga(loopingSaga);

saga
  .next()

  .take('HELLO')
  .next(action)
  .call(identity, action)
  .next()

  .take('HELLO')
  .next(action)
  .call(identity, action)
  .next()

  .finish(42)
  .returns(42);
```

### Save and Restore History

For more robust time travel, you can use the `save` and `restore` methods. The
`save` method allows you to label a point in the saga that you can return to by
calling `restore` with the same label. This can be more useful and less brittle
than using the simple `back` method.

```js
function getPredicate() {}
function getFinalPayload() {}

export default function* mainSaga() {
  try {
    yield take('READY');

    const predicate = yield select(getPredicate);

    if (predicate) {
      yield take('TRUE');
    } else {
      yield take('FALSE');
    }

    let payload = yield select(getFinalPayload);

    payload %= 101;

    yield put({ payload, type: 'DONE' });
  } catch (e) {
    yield take('ERROR');
  }
}

const saga = testSaga(mainSaga);

saga
  .next()
  .take('READY')

  .next()
  .select(getPredicate)

  .save('before predicate') // <-- save the point before if/else
  .next(true)
  .take('TRUE')

  .next()
  .select(getFinalPayload)

  .next(42)
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone()

  .restore('before predicate') // <-- restore history before if/else
  .next(false)
  .take('FALSE')

  .next()
  .select(getFinalPayload)

  .next(42)
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone();
```

As the names suggest `save` and `restore` allow you to restore saved history.
This can sometimes be beneficial for fast forwarding through a saga.

```js
saga
  .next()
  .take('READY')

  .next()
  .select(getPredicate)

  .save('before predicate') // <--
  .next(true)
  .take('TRUE')

  .next()
  .select(getFinalPayload)

  .save('predicate=true, before supply final payload') // <--
  .next(42)
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone()

  .restart()
  .restore('before predicate') // <--
  .next(false)
  .take('FALSE')

  .restore('predicate=true, before supply final payload') // <--
  .next(102)
  .put({ type: 'DONE', payload: 1 })

  .next()
  .isDone();
```

### NOTE

Despite what the previous example suggests, `save` and `restore` don't
necessarily allow you to jump forward in your saga. As mentioned, they
**restore** history. This means the saga will be restarted, and the history for
the named label will be applied to get you back to a certain point in the saga.
For some cases, you can use this to jump forward, but in other cases, you might
expect the internal state of your saga to be different from what the applied
history had. Here's an example to show what wouldn't work with `save` and
`restore`.

```js
function getPredicate() {}
function itWasTrue() {}
function itWasFalse() {}

export default function* mainSaga() {
  try {
    yield take('READY');

    const predicate = yield select(getPredicate);

    if (predicate) {
      yield take('TRUE');
      yield call(itWasTrue);
    } else {
      yield take('FALSE');
      yield call(itWasFalse);
    }

    yield put({ type: 'DONE', payload: predicate });
  } catch (e) {
    yield take('ERROR');
  }
}

const saga = testSaga(mainSaga);

saga
  .next()
  .take('READY')

  .next()
  .select(getPredicate)

  .save('before predicate') // <--
  .next(true)
  .take('TRUE')

  .next()
  .call(itWasTrue)

  .save('before final put') // <--
  .next()
  .put({ type: 'DONE', payload: true })

  .next()
  .isDone()

  .restore('before predicate') // <-- restore and update predicate value
  .next(false)
  .take('FALSE')

  .restore('before final put') // <--
  .next()
  .put({ type: 'DONE', payload: false }) // <-- this will be wrong

  .next()
  .isDone();

// SagaTestError:
// Assertion 5 failed: put effects do not match
//
// Expected
// --------
// { channel: null, action: { type: 'DONE', payload: false } }
//
// Actual
// ------
// { channel: null, action: { type: 'DONE', payload: true } }
```

Even though we restore the `'before predicate'` label and supply a new value to
the `predicate` variable, that will get overwritten to whatever the history for
`predicate` was when we saved the `'before final put'` label. True time travel
is not available yet but is a tentatively planned feature in the future. Ideas
and contributions are welcome to add true time travel.
