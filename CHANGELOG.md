## v1.4.0

### NEW - `inspect` helper

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
