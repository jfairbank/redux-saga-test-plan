## v3.7.0

### NEW - Support providers in yielded iterators (#199)

If you yield an iterator inside of a saga, then Redux Saga Test Plan will now
ensure that provided values works inside the yielded iterator. See the example
below.

```js
import { put, select } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';

const selector = state => state.test;

function* mainSaga() {
  function* innerSaga() {
    const result = yield select(selector);
    return !!result;
  }

  const result = yield innerSaga();

  if (result) {
    yield put({ type: 'DATA', payload: 42 });
  }
}

test('provides value for yielded iterators', () => {
  return expectSaga(mainSaga)
    .provide([
      [select(selector), true]
    ])
    .put({ type: 'DATA', payload: 42 })
    .run();
});
```

---

## v3.6.0

### NEW - Support `getContext` and `setContext` (#154)

Credit [@matoilic](https://github.com/matoilic) for adding support.

* You can now use `getContext` and `setContext` assertions, providers, and matchers with `expectSaga`.
* You can now use `getContext` and `setContext` assertions with `testSaga`.

### Bug Fixes

* (#183) You can now provide mock values for nested forks and spawns.  
  Credit [@jessjenk](https://github.com/jessjenk).

## v3.5.1

### Bug Fixes

* Fix incorrect TypeScript typing for `silentRun` (#154, credit [@mrijke](https://github.com/mrijke))

---

## v3.5.0

### NEW - Support `all` effect with inner object

```js
function* saga() {
  const { name, age } = yield all({
    name: select(selectors.getName),
    age: select(selectors.getAge),
  });

  yield put({ type: 'USER', payload: { name, age } });
}
```

### NEW - Support `race` effect with inner array

```js
function* saga(id) {
  const [user] = yield race([
    call(getUser, id),
    call(delay, 1000),
  ]);

  if (user) {
    yield put({ type: 'USER', payload: user });
  } else {
    yield put({ type: 'TIMEOUT' });
  }
}
```

---

## v3.4.1

### Bug Fixes

* Include `*.d.ts` files in package.json `files` property.

---

## v3.4.0

### NEW - TypeScript Support

Thanks to [@sharkBiscuit](https://github.com/sharkBiscuit) for adding TypeScript typings support in [#159](https://github.com/jfairbank/redux-saga-test-plan/pull/159).

### NEW - Support Action Creators with `toString`

Match redux-saga support for action creators that have a `toString` function defined. If you're using something like [redux-actions](https://github.com/reduxactions/redux-actions), then you can `take` your action creators directly. This was sort of working before, but redux-saga-test-plan treated it like a function to call and check if it should match an action. Because the action creator returned a truthy object, it took the action anyway. Now, redux-saga-test-plan uses `toString` to convert the action creator into a matchable string pattern like redux-saga.

```js
import { call, put, take } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';

const actionCreatorWithToString = payload => ({ type: 'TO_STRING_ACTION', payload });
actionCreatorWithToString.toString = () => 'TO_STRING_ACTION';

function* saga(fn) {
  const action = yield take(actionCreatorWithToString);
  yield put({ type: 'DONE', payload: action.payload });
}

test('takes action creators with toString defined', () => {
  return expectSaga(sagaTakeActionCreatorWithToString, spy)
    .put({ type: 'DONE', payload: 42 })
    .dispatch(actionCreatorWithToString(42))
    .run();
});
```

### Miscellaneous Fixes

* Remove unnecessary npm package dependency on GitBook plugins

---

## v3.3.1

### Bug Fixes

* Ensure that actions dispatched inside sagas are immediately handled by reducers.  
  Related PR: #154  
  (credit [@gjdenhertog](https://github.com/gjdenhertog))

---

## v3.3.0

### Redux Saga 0.16 support

Update `peerDependencies` to support redux-saga 0.16.

---

## v3.2.0

### NEW features in `expectSaga`

#### Expose all effects when saga finishes

The object resolved by the `Promise` returned from the `run` method now includes
an array called `allEffects` that contains all of the effects yielded by your
saga. You can use this array to test specific ordering of effects.
(credit [@sbycrosz](https://github.com/sbycrosz))

```js
function* saga() {
  yield call(identity, 42);
  yield put({ type: 'HELLO' });
}

it('exposes all yielded effects in order', () => {
  return expectSaga(saga)
    .run()
    .then((result) => {
      const { allEffects } = result;

      expect(allEffects).toEqual([
        call(identity, 42),
        put({ type: 'HELLO' }),
      ]);
    });
});
```

### Flow types

Flow types available in `decls/index.js` in the [source
repo](https://github.com/jfairbank/redux-saga-test-plan) are now available in
the npm package.

### Bug Fixes

* Rejected `Promises` inside sagas no longer cause `UnhandledPromiseRejectionWarning`.  
  Related issue: #123  
  (credit [@MehdiZonjy](https://github.com/MehdiZonjy))

---

## v3.1.0

### NEW features in `expectSaga`

#### Exposed effects when saga finishes

The `Promise` returned by the `run` method now resolves with an object that
contains any effects yielded by your saga and sagas that it forked. You can use
this for finer-grained control over testing exact number of effects. Be careful
when testing top-level sagas that fork other sagas because the effects object
will include yielded effects from all forked sagas too. There currently is no
way to distinguish between effects yielded by the top-level saga and forked
sagas.

```js
function* userSaga(id) {
  const user = yield call(fetchUser, id);
  const pet = yield call(fetchPet, user.petId);

  yield put({ type: 'DONE', payload: { user, pet } });
}

it('exposes effects', () => {
  const id = 42;
  const petId = 20;

  const user = { id, petId, name: 'Jeremy' };
  const pet = { name: 'Tucker' };

  return expectSaga(saga, id)
    .provide([
      [call(fetchUser, id), user],
      [call(fetchPet, petId), pet],
    ])
    .run()
    .then((result) => {
      const { effects } = result;

      expect(effects.call).toHaveLength(2);
      expect(effects.put).toHaveLength(1);

      expect(effects.call[0]).toEqual(call(fetchUser, id));
      expect(effects.call[1]).toEqual(call(fetchPet, petId));

      expect(effects.put[0]).toEqual(
        put({ type: 'DONE', payload: { user, pet } })
      );
    });
});
```

Of course, `async` functions work nicely with this feature too.

```js
it('exposes effects using async functions', async () => {
  const id = 42;
  const petId = 20;

  const user = { id, petId, name: 'Jeremy' };
  const pet = { name: 'Tucker' };

  const { effects } = await expectSaga(saga, id)
    .provide([
      [call(fetchUser, id), user],
      [call(fetchPet, petId), pet],
    ])
    .run();

  expect(effects.call).toHaveLength(2);
  expect(effects.put).toHaveLength(1);

  expect(effects.call[0]).toEqual(call(fetchUser, id));
  expect(effects.call[1]).toEqual(call(fetchPet, petId));

  expect(effects.put[0]).toEqual(
    put({ type: 'DONE', payload: { user, pet } })
  );
});
```

The available effects are:

- `actionChannel`
- `call`
- `cps`
- `fork`
- `join`
- `put`
- `race`
- `select`
- `take`

#### Snapshot Testing

The returned `Promise` also resolves with a `toJSON` method that serializes the
effects to a form appropriate for snapshot testing.

```js
it('can be used with snapshot testing', () => {
  return expectSaga(saga)
    .run()
    .then((result) => {
      expect(result.toJSON()).toMatchSnapshot();
    });
});
```

#### Test Final Store State

If you're using the `withReducer` function, you can test the final store state
after your saga finishes in two ways.

You can use the `hasFinalState` method assertion in your `expectSaga` method
chain.

```js
const initialDog = {
  name: 'Tucker',
  age: 11,
};

function dogReducer(state = initialDog, action) {
  if (action.type === 'HAVE_BIRTHDAY') {
    return {
      ...state,
      age: state.age + 1,
    };
  }

  return state;
}

function* saga() {
  yield put({ type: HAVE_BIRTHDAY });
}

it('tests final store state', () => {
  return expectSaga(saga)
    .withReducer(dogReducer)
    .hasFinalState({
      name: 'Tucker',
      age: 12,
    })
    .run();
});
```

Or the returned `Promise` resolves with a `storeState` object to test.

```js
it('tests final store state', () => {
  return expectSaga(saga)
    .withReducer(dogReducer)
    .run()
    .then((result) => {
      expect(result.storeState).toEqual({
        name: 'Tucker',
        age: 12,
      });
    });
});
```

#### Exposed Return Value

The returned `Promise` also resolves with the top-level saga's return value.

```js
function* saga() {
  const data = yield call(someApi);
  return data;
}

it('exposes the return value', () => {
  return expectSaga(saga)
    .provide([
      [call(someApi), 42],
    ])
    .run()
    .then((result) => {
      expect(result.returnValue).toEqual(42);
    });
});
```

#### Easier warning suppression with `silentRun`

You can silence timeout warnings easier with the `silentRun` method.  The
`silentRun` method returns the same `Promise` as the `run` method.  (credit
[@Bebersohl](https://github.com/Bebersohl))

```js
.silentRun()    // same as .run({ silenceTimeout: true })
.silentRun(500) // same as .run({ silenceTimeout: true, timeout: 500 })
```

---

## v3.0.2

* Update the docs about supported Redux Saga versions.

---

## v3.0.1

* Update the docs about supported Redux Saga versions.

---

## v3.0.0

### Redux Saga 0.15.x support

Redux Saga introduced some new features that merited a major bump in Redux Saga
Test Plan. The upgrade path is minimal but involves a couple breaking changes.
To learn more about Redux Saga v0.15.x, please visit the
[release page](https://github.com/redux-saga/redux-saga/releases/tag/v0.15.0).

**Please make sure to thoroughly read the release notes below for all the new
features and breaking changes.**

### New in `expectSaga`

#### Dynamic `all` Provider

Added support for a dynamic `all` provider to handle parallel effects. This is
now the preferred pattern for parallel effects, meaning yielding arrays is
deprecated in Redux Saga.

You can still provide values for effects inside of an `all` effect just like you
could do with effects yielded inside an array.

```js
import { all, call, put } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga';
import * as matchers from 'redux-saga/matchers';

const identity = value => value;

function* saga() {
  const results = yield all([
    put({ type: 'HELLO' }),
    call(identity, 42),
  ]);

  yield put({ type: 'RESULTS', payload: results });
}

it('works with `all`', () => {
  return expectSaga(saga)
    .provide({
      all: () => ['foo', 'bar'],
    })
    .put({ type: 'RESULTS', payload: ['foo', 'bar'] })
    .run();
});

it('internal effects can be provided', () => {
  return expectSaga(saga)
    .provide([
      [matches.put.actionType('HELLO'), 'foo'],
      [matches.call.fn(identity), 'bar'],
    ])
    .put({ type: 'RESULTS', payload: ['foo', 'bar'] })
    .run();
});
```

#### Method String Syntax

This works out of the box with Redux Saga Test Plan.

```js
const context = { foo: () => 1 };

function* saga() {
  const value = yield call([context, 'foo']);
  yield put({ type: 'VALUE', payload: value });
}

it('works with call', () => {
  return expectSaga(saga)
    .call([context, 'foo'])
    .run();
});

it('works with partial assertions', () => {
  return expectSaga(saga)
    .call.fn(context.foo)
    .run();
});

it('works with providers', () => {
  return expectSaga(saga)
    .provide([
      [call([context, 'foo']), 42],
    ])
    .put({ type: 'VALUE', payload: 42 })
    .run();
});
```

### BREAKING Changes in `expectSaga`

* Officially removed the `provideInForkedTasks` option for dynamic providers.
* Removed the dynamic `parallel` provider. Please use the dynamic `all` provider
  mentioned above in the new features.

### New in `testSaga`

#### Assertion for `all`

Added support for an `all` assertion. This is mentioned in the breaking changes
below, but `all` can be used in place of the old `parallel` assertion if you're
still yielding arrays.

```js
import { all, call, put } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga';
import * as matchers from 'redux-saga/matchers';

const identity = value => value;

function* saga() {
  const results = yield all([
    put({ type: 'HELLO' }),
    call(identity, 42),
  ]);

  yield put({ type: 'RESULTS', payload: results });
}

it('works with `all`', () => {
  testSaga(saga)
    .next()
    .all([
      put({ type: 'HELLO' }),
      call(identity, 42),
    ])

    .next(['foo', 'bar'])
    .put({ type: 'RESULTS', payload: ['foo', 'bar'] });
});
```

#### Method String Syntax

This works out of the box with Redux Saga Test Plan.

```js
const context = { foo: () => 1 };

function* saga() {
  const value = yield call([context, 'foo']);
  yield put({ type: 'VALUE', payload: value });
}

it('works with call', () => {
  testSaga(saga)
    .next()
    .call([context, 'foo']);
});
```

### BREAKING Changes in `testSaga`

* Removed the `parallel` assertion. Please use the `all` assertion mentioned
  above in the new features. The `all` assertion works with yielded `all`
  effects and deprecated yielded arrays.

### Other BREAKING Changes

* Removed the default `testSaga` export. Use named imports for `expectSaga` and
`testSaga`.

  ```js
  import testSaga from 'redux-saga-test-plan'; // <-- this is gone

  import { expectSaga, testSaga } from 'redux-saga-test-plan'; // <-- this is correct
  ```

### MISSING Features

* No support has been added for the new `getContext` and `setContext` effect
  creators yet. I'm waiting on the
  [docs](https://github.com/redux-saga/redux-saga/issues/943) to be filled in
  before I feel comfortable supporting these effects.

---

## v2.4.4

### Bug Fix

Attempting to rename the `sagaWrapper` function in `expectSaga` to the name of a
forked saga caused a thrown error in PhantomJS. This is a bug in PhantomJS that
will likely never be fixed:
[issue](https://github.com/ariya/phantomjs/issues/14310). Accordingly, Redux
Saga Test Plan catches the thrown error now.

**NOTE:** this means that you **can't** depend on the task `name` property being
correct in PhantomJS. For `expectSaga` to work properly, it necessarily has to
wrap forked sagas with `sagaWrapper` in order to intercept effects with
providers.

---

## v2.4.3

Update docs with some examples.

---

## v2.4.2

### Bug Fixes

* `expectSaga`
  * Ensure that the task object for forked/spawned `sagaWrapper` tasks has the
    same name as the wrapped saga. Check #96 for more context.
  * Ensure that forked/spawned sagas can detect cancellation.

---

## v2.4.1

### Bug Fixes

* Effects nested in a `race` effect weren't being properly handled to ensure
  that nested generator functions could receive provided values.
* Tested sagas were being blocked by redux-saga if function calls or providers
  returned falsy values that weren't `null` or `undefined`. Check #94 for more
  context.

---

## v2.4.0

### DEPRECATION in `expectSaga`

Providers now automatically work in forked/spawned sagas, meaning the
`provideInForkedTasks` option is no longer needed. If you are still using the
option, Redux Saga Test Plan will print a warning message, letting you know that
you can safely remove it. More details are provided later in these release
notes, but the internal limitation that necessitated the `provideInForkedTasks`
option has been fixed.

### NEW features in `expectSaga`

Lots of new features are now available in `expectSaga` to make testing easier!
Please read through the awesome additions below.

#### Static Providers

You can now provide mock values in a terser manner via static providers. Pass in
an array of tuple pairs (array pairs) into the `provide` method. For each pair,
the first element should be a matcher for matching the effect and the second
effect should be the mock value you want to provide. You can use effect creators
from `redux-saga/effects` as matchers or import matchers from
`redux-saga-test-plan/matchers`. The benefit of using Redux Saga Test Plan's
matchers is that they also offer partial matching. For example, you can use
`call.fn` to match any calls to a function without regard to its arguments.

```js
import { call, put, select } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';
import api from 'my-api';
import * as selectors from 'my-selectors';

function* saga() {
  const id = yield select(selectors.getId);
  const user = yield call(api.fetchUser, id);

  yield put({ type: 'RECEIVE_USER', payload: user });
}

it('provides a value for the API call', () => {
  return expectSaga(saga)
    .provide([
      // Use the `select` effect creator from Redux Saga to match
      [select(selectors.getId), 42],

      // Use the `call.fn` matcher from Redux Saga Test Plan
      [matchers.call.fn(api.fetchUser), { id: 42, name: 'John Doe' }],
    ])
    .put({
      type: 'RECEIVE_USER',
      payload: { id: 42, name: 'John Doe' },
    })
    .run();
});
```

#### Throw Errors with Static Providers

You can simulate errors with static providers via the `throwError` function from
the `redux-saga-test-plan/providers` module. When providing an error, wrap it
with a call to `throwError` to let Redux Saga Test Plan know that you want to
simulate a thrown error.

```js
import { call, put } from 'redux-saga/effects';
import * as matchers from 'redux-saga-test-plan/matchers';
import { throwError } from 'redux-saga-test-plan/providers';
import api from 'my-api';

function* userSaga(id) {
  try {
    const user = yield call(api.fetchUser, id);
    yield put({ type: 'RECEIVE_USER', payload: user });
  } catch (e) {
    yield put({ type: 'FAIL_USER', error: e });
  }
}

it('handles errors', () => {
  const error = new Error('error');

  return expectSaga(userSaga)
    .provide([
      [matchers.call.fn(api.fetchUser), throwError(error)],
    ])
    .put({ type: 'FAIL_USER', error })
    .run();
});
```

#### Multiple object providers

If you prefer to use the object providers syntax, you can now supply multiple
object providers via a couple methods. The easiest way is to pass in an array of
object providers to the `provide` method. Provider functions will be composed
according to the effect type, meaning the provider functions in the first object
will be called before subsequent provider functions in the array.

Because provider functions are composed, they are similar to middleware. The
`next` function argument inside provider functions allows you to delegate to the
next provider in the middleware stack. If no more providers are available, then
`next` will delegate to Redux Saga to handle the effect as normal.

```js
import { call, put, select } from 'redux-saga/effects';
import api from 'my-api';
import * as selectors from 'my-selectors';

function* saga() {
  const user = yield call(api.findUser, 1);
  const dog = yield call(api.findDog);
  const greeting = yield call(api.findGreeting);
  const otherData = yield select(selectors.getOtherData);

  yield put({
    type: 'DONE',
    payload: { user, dog, greeting, otherData },
  });
}

const fakeUser = { name: 'John Doe' };
const fakeDog = { name: 'Tucker' };
const fakeOtherData = { foo: 'bar' };

const provideUser = ({ fn, args: [id] }, next) => (
  fn === api.findUser ? fakeUser : next()
);

const provideDog = ({ fn }, next) => (
  fn === api.findDog ? fakeDog : next()
);

const provideOtherData = ({ selector }, next) => (
  selector === selectors.getOtherData ? fakeOtherData : next()
);

it('takes multiple providers and composes them', () => {
  return expectSaga(saga)
    .provide([
      { call: provideUser, select: provideOtherData },
      { call: provideDog },
    ])
    .put({
      type: 'DONE',
      payload: {
        user: fakeUser,
        dog: fakeDog,
        greeting: 'hello',
        otherData: fakeOtherData,
      },
    })
    .run();
});
```

An alternative to supplying multiple provider objects is to only pass one object
into `provide` and use the `composeProviders` function to compose multiple
provider functions for a specific effect. You can import the `composeProviders`
function from the `redux-saga-test-plan/providers` module. The provider
functions are composed from left to right.

```js
import { composeProviders } from 'redux-saga-test-plan/providers';

it('takes multiple providers and composes them', () => {
  return expectSaga(saga)
    .provide({
      call: composeProviders(
        provideUser,
        provideDog
      ),

      select: provideOtherData,
    })
    .put({
      type: 'DONE',
      payload: {
        user: fakeUser,
        dog: fakeDog,
        greeting: 'hello',
        otherData: fakeOtherData,
      },
    })
    .run();
});
```

#### Static Providers with Dynamic Values

Static providers can provide dynamic values too. Instead of supplying a static
value, you can supply a function that produces the value. This function takes as
arguments the effect as well as the `next` function in case you want to the next
provider or Redux Saga to handle the effect. Additionally, you must wrap the
function with a call to the `dynamic` function from the
`redux-saga-test-plan/providers` module.

```js
import { call, put } from 'redux-saga/effects';
import * as matchers from 'redux-saga-test-plan/matchers';
import { dynamic } from 'redux-saga-test-plan/providers';

const add2 = a => a + 2;

function* someSaga() {
  const x = yield call(add2, 4);
  const y = yield call(add2, 6);
  const z = yield call(add2, 8);

  yield put({ type: 'DONE', payload: x + y + z });
}

const provideDoubleIf6 = ({ args: [a] }, next) => (
  a === 6 ? a * 2 : next()
);

const provideTripleIfGt4 = ({ args: [a] }, next) => (
  a > 4 ? a * 3 : next()
);

it('works with dynamic static providers', () => {
  return expectSaga(someSaga)
    .provide([
      [matchers.call.fn(add2), dynamic(provideDoubleIf6)],
      [matchers.call.fn(add2), dynamic(provideTripleIfGt4)],
    ])
    .put({ type: 'DONE', payload: 42 })
    .run();
});
```

#### Assert Effects with Provided Values

Prior to v2.4.0, if you provided a value for a particular effect, then you were
unable to also assert that your saga yielded that particular effect. This is now
fixed, so you can assert on these effects. One use case for this is if you
wanted to provide a value for any API call but also assert that your saga called
the API function with certain arguments.

```js
import { call, put } from 'redux-saga/effects';
import * as matchers from 'redux-saga-test-plan/matchers';
import api from 'my-api';

function* userSaga(id) {
  const user = yield call(api.fetchUser, id);
  yield put({ type: 'RECEIVE_USER', payload: user });
}

it('handles errors', () => {
  const id = 42;
  const fakeUser = { id, name: 'John Doe' };

  return expectSaga(userSaga, id)
    .provide([
      // Provide `fakeUser` for the function call
      [matchers.call.fn(api.fetchUser), fakeUser],
    ])
    // Still assert that the function was called with the `id`
    .call(api.fetchUser, id)
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run();
});
```

#### Assert Return Values

You can assert the return value of a saga via the `returns` method. This only
works for the top-level saga under test, meaning other sagas that are invoked
via `call`, `fork`, or `spawn` won't report their return value.

```js
function* saga() {
  return { hello: 'world' };
}

it('returns a greeting', () => {
  return expectSaga(saga)
    .returns({ hello: 'world' })
    .run();
});
```

---

## v2.3.6

### Bug Fix

Return values from sagas now work with the `call` effect with `expectSaga`.

```js
import { call, put } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';

it('returns values from other sagas', () => {
  function* otherSaga() {
    return { hello: 'world' }; // <-- this now works in tests
  }

  function* saga() {
    const result = yield call(otherSaga);
    yield put({ type: 'RESULT', payload: result });
  }

  return expectSaga(saga)
    .put({ type: 'RESULT', payload: { hello: 'world' } })
    .run();
});
```

---

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
handlers as values. Each function handler takes two arguments, the yielded
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
