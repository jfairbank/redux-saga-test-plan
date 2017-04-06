## v2.3.5

### Bug Fix

Providers now work with composed/nested sagas invoked via the `call` effect.

---

## v2.3.4

### Bug Fixes

* `takeEvery`/`takeLatest` workers now receive the dispatched action that
  triggered them when using the `provideInForkedTasks` option.
* Yielding `takeEvery`/`takeLatest` inside an array now works with the
  `provideInForkedTasks` option.

**Note:** these fixes only apply to the `takeEvery` and `takeLatest` effect
creators from the `redux-saga/effects` module. The `takeEvery` and `takeLatest`
saga helpers from the `redux-saga` module are deprecated and therefore
unsupported by Redux Saga Test Plan.

---

## v2.3.3

### Bug Fix

Providers now work with workers given to `takeEvery` and `takeLatest` if you
supply the `provideInForkedTasks` option to `expectSaga.provide`.

**Note:** this applies only to the `takeEvery` and `takeLatest` effect creators
from the `redux-saga/effects` module. The `takeEvery` and `takeLatest` saga
helpers from the `redux-saga` module are deprecated and therefore unsupported by
Redux Saga Test Plan.

---

## v2.3.2

### Bug Fix

The internal `sagaWrapper` implementation used by `expectSaga` required a
dependency on `regeneratorRuntime`. `sagaWrapper` was rewritten to explicitly
utilize [fsm-iterator](https://github.com/jfairbank/fsm-iterator) instead.

---

## v2.3.1

### Bug Fix

Sagas that used the `take` effect creator with patterns besides strings and
symbols (i.e. arrays and functions) were not receiving dispatched actions.
Here's an example of a saga that takes an array that should work now:

```js
function* sagaTakeArray() {
  const action = yield take(['FOO', 'BAR']);
  yield put({ type: 'DONE', payload: action.payload });
}

it('takes action types in an array', () => {
  return expectSaga(sagaTakeArray)
    .put({ type: 'DONE', payload: 'foo payload' })
    .dispatch({ type: 'FOO', payload: 'foo payload' })
    .run();
});
```

---

## v2.3.0

### NEW features in `expectSaga`

Lots of new features are now available in `expectSaga` to make testing easier!
Please read through the awesome additions below.

#### Provide mock/fake values

Sometimes integration testing sagas can be laborious, especially when you have
to mock server APIs for `call` or create fake state and selectors to use with
`select`.

To make tests simpler, Redux Saga Test Plan allows you to intercept and handle
effect creators instead of letting Redux Saga handle them. This is similar to a
middleware layer that Redux Saga Test Plan calls _providers_.

To use providers, you can call the `provide` method. The `provide` method takes
one argument, an object literal with effect creator names as keys and function
handlers as arguments. Each function handler takes two arguments, the yielded
effect and a `next` callback. You can inspect the effect and return a fake value
based on the properties in the effect. If you don't want to handle the effect
yourself, you can pass it on to Redux Saga by invoking the `next` callback
parameter.

Here is an example with Jest to show you how to supply a fake value for an API
call:

```js
import { call, put, take } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import api from 'my-api';

function* saga() {
  const action = yield take('REQUEST_USER');
  const id = action.payload;

  const user = yield call(api.fetchUser, id);

  yield put({ type: 'RECEIVE_USER', payload: user });
}

it('provides a value for the API call', () => {
  return expectSaga(saga)
    .provide({
      call(effect, next) {
        // Check for the API call to return fake value
        if (effect.fn === api.fetchUser) {
          const id = effect.args[0];
          return { id, name: 'John Doe' };
        }

        // Allow Redux Saga to handle other `call` effects
        return next();
      },
    })
    .put({
      type: 'RECEIVE_USER',
      payload: { id: 1, name: 'John Doe' },
    })
    .dispatch({ type: 'REQUEST_USER', payload: 1 })
    .run();
});
```

#### Partial Matching Assertions

Sometimes you're not interested in the exact arguments passed to a `call` effect
creator or the payload inside an action from a `put` effect. Instead you're only
concerned with _if_ a particular function was invoked via `call` or _if_ a
particular action type was dispatched via `put`. You can handle these situations
with partial matcher assertions.

Here is an example that uses the convenient matcher helper methods `call.fn` and
`put.actionType`:


```js
function* userSaga(id) {
  try {
    const user = yield call(api.fetchUser, id);
    yield put({ type: 'RECEIVE_USER', payload: user });
  } catch (e) {
    yield put({ type: 'FAIL_USER', error: e });
  }
}

it('fetches user', () => {
  return expectSaga(userSaga)
    .call.fn(api.fetchUser)
    .run();
});

it('fails', () => {
  return expectSaga(userSaga)
    .provide({
      call() {
        throw new Error('Not Found');
      },
    })
    .put.actionType('FAIL_USER')
    .run();
});
```

Notice that we can assert that the `api.fetchUser` function was called without
specifying the arguments. We can also assert in a failure scenario that an
action of type `FAIL_USER` was dispatched without worrying about the `error`
property of the action.

#### Negate assertions

You can now negate assertions. Use the `not` property before calling an
`assertion`. Negated assertions also work with partial matcher assertions!

```js
function* authSaga() {
  const token = yield select(authToken);

  if (token) {
    yield call(api.setToken, token);
  }
}

it('does not set the token', () => {
  return expectSaga(authSaga)
    .withState({})
    .not.call.fn(api.setToken)
    .run();
});
```

#### Dispatch actions while saga is running

You can now dispatch actions while a saga is running. This is useful for
delaying actions so Redux Saga Test Plan doesn't dispatch them too quickly.

```js
function* mainSaga() {
  // Received almost immediately
  yield take('FOO');

  // Received after 250ms
  yield take('BAR');
  yield put({ type: 'DONE' });
}

const delay = time => new Promise((resolve) => {
  setTimeout(resolve, time);
});

it('can dispatch actions while running', () => {
  const saga = expectSaga(mainSaga);

  saga.put({ type: 'DONE' });

  saga.dispatch({ type: 'FOO' });

  const promise = saga.run({ timeout: false });

  return delay(250).then(() => {
    saga.dispatch({ type: 'BAR' });
    return promise;
  });
});
```

#### Delaying dispatching actions with `.delay()`

While being able to dispatch actions while the saga is running has use cases
besides only delaying, if you just want to delay dispatched actions, you can use
the `delay` method. It takes a delay time as its only argument.

```js
it('can delay actions', () => {
  return expectSaga(mainSaga)
    .put({ type: 'DONE' })
    .dispatch({ type: 'FOO' })
    .delay(250)
    .dispatch({ type: 'BAR' })
    .run({ timeout: false });
});
```

---

## v2.2.1

### Bug Fixes

- Forked sagas no longer extend the timeout of `expectSaga`. The original
  behavior was not properly documented and probably unhelpful behavior anyway.
  (credit [@peterkhayes](https://github.com/peterkhayes))
- Forked sagas caused the `silenceTimeout` option of `expectSaga` to not work.
  This is now fixed. (credit [@peterkhayes](https://github.com/peterkhayes))

---

## v2.2.0

### NEW - `withReducer` method for `expectSaga`

To `select` state that might change, you can use the `withReducer` method. It
takes two arguments: your reducer and optional initial state. If you don't
supply the initial state, then `withReducer` will extract it by passing an
initial action into your reducer like Redux.

```js
const HAVE_BIRTHDAY = 'HAVE_BIRTHDAY';
const AGE_BEFORE = 'AGE_BEFORE';
const AGE_AFTER = 'AGE_AFTER';

const initialDog = {
  name: 'Tucker',
  age: 11,
};

function dogReducer(state = initialDog, action) {
  if (action.type === HAVE_BIRTHDAY) {
    return {
      ...state,
      age: state.age + 1,
    };
  }

  return state;
}

function getAge(state) {
  return state.age;
}

function* saga() {
  const ageBefore = yield select(getAge);

  yield put({ type: AGE_BEFORE, payload: ageBefore });

  yield take(HAVE_BIRTHDAY);

  const ageAfter = yield select(getAge);

  yield put({ type: AGE_AFTER, payload: ageAfter });
}

it('handles reducers when not supplying initial state', () => {
  return expectSaga(saga)
    .withReducer(dogReducer)

    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 12 })

    .dispatch({ type: HAVE_BIRTHDAY })
    .run();
});

it('handles reducers when supplying initial state', () => {
  return expectSaga(saga)
    .withReducer(dogReducer, initialDog)

    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 12 })

    .dispatch({ type: HAVE_BIRTHDAY })
    .run();
});
```

---

## v2.1.0

### NEW - Integration Testing :tada:

**NOTE: `expectSaga` is a relatively new feature of Redux Saga Test Plan, and
many kinks may still need worked out and other use cases considered.**

**Requires global `Promise` to be available**

Redux Saga Test Plan now exports a new function called `expectSaga` for
integration, BDD-style testing!

One downside to unit testing is that it couples your test to your
implementation. Simple reordering of yielded effects in your saga could break
your tests even if the functionality stays the same. If you're not concerned
with the order or exact effects your saga yields, then you can take a
integrative approach, testing the behavior of your saga when run by Redux Saga.
Then, you can simply test that a particular effect was yielded during the saga
run. `expectSaga` runs your saga asynchronously, so it returns a `Promise`.

```js
import { expectSaga } from 'redux-saga-test-plan';

function identity(value) {
  return value;
}

function* mainSaga(x, y) {
  const action = yield take('HELLO');

  yield put({ type: 'ADD', payload: x + y });
  yield call(identity, action);
}

it('works!', () => {
  return expectSaga(mainSaga, 40, 2)
    // assert that the saga will eventually yield `put`
    // with the expected action
    .put({ type: 'ADD', payload: 42 })

    // dispatch any actions your saga will `take`
    .dispatch({ type: 'HELLO' })

    // run it
    .run();
});
```

---

## v2.0.0

### Redux Saga 0.14.x support

#### Effect Creators for Saga Helpers

Redux Saga introduced effect creators for the saga helpers `takeEvery`,
`takeLatest`, and `throttle` in order to simply interacting with and testing
these helpers. Please review the example from Redux Saga's [release
notes](https://github.com/redux-saga/redux-saga/releases/tag/v0.14.0) below:

```js
import { takeEvery } from 'redux-saga/effects'
// ...
yield* takeEvery('ACTION', worker) // this WON'T work, as effect is just an object
const task = yield takeEvery('ACTION', worker) // this WILL work like charm

-----

import { takeEvery } from 'redux-saga'
// ...
yield* takeEvery('ACTION', worker) // this will continue to work for now
const task = yield takeEvery('ACTION', worker) // and so will this
```

Accordingly, Redux Saga Test Plan now supports testing these effect creators via
the respective assertion methods `takeEveryEffect`, `takeLatestEffect`, and
`throttleEffect`. The old patterns of delegating or yielding the helpers
directly is deprecated and may eventually be removed by Redux Saga and Redux
Saga Test Plan. Your are encouraged to move to using the equivalent effect
creators.

#### Name Changes

Redux Saga renamed `takem` to `take.maybe`. Redux Saga Test Plan has added an
equivalent `take.maybe` assertion method. The former is deprecated but still
available in Redux Saga and Redux Saga Test Plan.

Redux Saga also renamed `put.sync` to `put.resolve`. Redux Saga Test Plan had
never supported `put.sync`, but now supports the renamed `put.resolve`. There
are no plans to support `put.sync` since it had never been added to Redux Saga
Test Plan, so please move to `put.resolve`.

### BREAKING CHANGES

The only real breaking change is that Redux Saga Test Plan drops support for
Redux Saga versions prior to 0.14.x. No assertion methods were removed or
renamed.

---

## v1.4.0

### NEW - `inspect` helper

Original idea and credit goes to
[@christian-schulze](https://github.com/christian-schulze).

The `inspect` method allows you to inspect the yielded value after calling
`next` or `throw`. This is useful for handling more complex scenarios such as
yielding nondeterministic values that the effect assertions and general
assertions can't test.

```js
function* saga() {
  yield () => 42;
}

testSaga(saga)
  .next()
  .inspect((fn) => {
    expect(fn()).toBe(42);
  });
```

### Redux Saga 0.13.0 support

Redux Saga 0.13.0 mainly introduced tweaks to their monitor API, which primarily
affected their middleware and internals. Therefore, Redux Saga Test Plan should
continue to work just fine with Redux Saga 0.13.0.

### Internal

- Migrate to jest for testing
- 100% code coverage
- Some internal cleanup
- Rearrange order of unsupported version errors in `createEffectHelperTester`
- Remove unsupported version error in `createTakeHelperProgresser`

---

## v1.3.1

## Bug Fixes

- Fix bug trying to access `utils.is.helper` when it may not be available in
  older versions of redux-saga.

---

## v1.3.0

### Support for Redux Saga v0.12.0

- Added `flush` effect creator assertion
- Add `throttle` saga helper assertion
- **Backwards-compatible support:** attempting to use an effect creator like
  `flush` or a saga helper like `throttle` on a version of Redux Saga that does
  not support it will throw an error with a message that your version lacks
  support.  This is primarily to keep from bumping the major version of Redux
  Saga Test Plan and ensure bug fixes for other features will work for all
  supported versions of Redux Saga (0.10.x - 0.12.x).
- Add support for testing yielded `takeEvery`, `takeLatest`, and `throttle`
  instead of just delegating to them. Use the `*Fork` variants: `takeEveryFork`,
  `takeLatestFork`, and `throttleFork`. Example below.

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

---

## v1.2.0

### NEW - Assertions for `takeEvery` and `takeLatest`

Redux Saga Test Plan now offers assertions for the saga helper functions
`takeEvery` and `takeLatest`. The difference between these assertions and the
normal effect creator assertions is that you shouldn't call `next` on your test
saga beforehand. The `takeEvery` and `takeLatest` functions in Redux Saga Test
Plan will automatically advance the saga for you. You can read more about
`takeEvery` and `takeLatest` in Redux Saga's docs
[here](http://yelouafi.github.io/redux-saga/docs/api/index.html#saga-helpers).

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
// Assertion 1 failed: expected to takeEvery READY with anotherSaga
```

---

## v1.1.1

### More helpful error messages (credit [@peterkhayes](https://github.com/peterkhayes))

Changed error messages to show assertion number if an assertion fails.

```js
function identity(value) {
  return value;
}

function* mainSaga() {
  yield call(identity, 42);
  yield put({ type: 'DONE' });
}

testSaga(mainSaga)
  .next()
  .call(identity, 42)

  .next()
  .put({ type: 'READY' })

  .next()
  .isDone();

// SagaTestError:
// Assertion 2 failed: put effects do not match
//
// Expected
// --------
// { channel: null, action: { type: 'READY' } }
//
// Actual
// ------
// { channel: null, action: { type: 'DONE' } }
```

---

## v1.1.0

### NEW - Restart with different arguments

You can now restart your saga with different arguments by supplying a variable
number of arguments to the `restart` method.

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

const saga = testSaga(mainSaga, 42);

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

### Miscellaneous

- Some internal variable renaming.

---

## v1.0.0

### :tada: First major release - no breaking changes

With the recent additions courtesy of [@rixth](https://github.com/rixth), the
API feels solid enough to bump to v1.0.0.

### NEW - Finish early (credit [@rixth](https://github.com/rixth))

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

const saga = testSaga(loopingSaga);

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
```

### NEW - Assert returned values (credit [@rixth](https://github.com/rixth))

Assert a value is returned from a saga and that it is finished with the
`returns` method.

```js
function* doubleSaga(x) {
  return x * 2;
}

const saga = testSaga(doubleSaga, 21);

saga
  .next()
  .returns(42);
```

### NEW - Save and restore history (credit [@rixth](https://github.com/rixth))

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

---

## v0.2.0

### More helpful error messaging

redux-saga-test-plan will now print out actual and expected effects when
assertions fail, so you have a better idea why a test is failing.

---

## v0.1.0

### Support redux-saga 0.11.x
