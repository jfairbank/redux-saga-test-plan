# API Reference

Redux Saga Test Plan exposes two saga testing styles:

- `expectSaga` for integration-style tests that run a saga and assert on effects, final state, return values, and errors.
- `testSaga` for unit-style tests that step through yielded effects in order.

It also exposes `matchers` and `providers` helpers through separate import paths.

```js
import { expectSaga, testSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';
import * as providers from 'redux-saga-test-plan/providers';
```

## `expectSaga(saga, ...sagaArgs)`

Creates an integration test for `saga`, passing `sagaArgs` to the saga when it runs.

```js
expectSaga(userSaga, userId)
  .provide([[call(fetchUser, userId), user]])
  .put(receiveUser(user))
  .run();
```

### Running sagas

#### `.run(timeout?)`

Starts the saga and returns a promise for the test result. The promise resolves with an object containing:

- `storeState`: final reducer state
- `returnValue`: the saga return value
- `effects`: recorded effects grouped by effect type
- `allEffects`: all recorded effects in order
- `toJSON()`: serializable representation for snapshot testing

The optional timeout is a number of milliseconds. Pass `false` to disable the timeout. The default timeout is `expectSaga.DEFAULT_TIMEOUT` milliseconds.

#### `.silentRun(timeout?)`

Like `.run`, but suppresses timeout warnings.

### Dispatching actions

#### `.dispatch(action)`

Dispatches an action to the saga. Calls may be chained before `.run`; actions are queued until the saga starts.

#### `.delay(time)`

Delays the next `.dispatch(action)` by `time` milliseconds.

```js
return expectSaga(watchUser)
  .put({ type: 'REQUEST_USER' })
  .dispatch({ type: 'REQUEST_USER' })
  .silentRun();
```

### State

#### `.withState(state)`

Supplies an initial state object without supplying a reducer.

#### `.withReducer(reducer, initialState?)`

Uses `reducer` to update state for dispatched actions. `initialState` is optional; when omitted, the reducer is invoked with an initialization action to create the initial state.

### Providers

#### `.provide(providers)`

Mocks values yielded by the saga. Providers can be an object keyed by effect type, an array of `[matcher, value]` pairs, or an array mixing object providers and pairs.

Static object providers use effect names such as `call`, `select`, `put`, `fork`, `race`, `take`, `actionChannel`, and the other supported Redux Saga effects.

```js
expectSaga(fetchUserSaga)
  .provide({
    call(effect, next) {
      if (effect.fn === fetchUser) {
        return user;
      }
      return next();
    },
  })
  .run();
```

Provider functions receive the yielded effect and a `next` function. Return `next()` to fall through to the next provider or Redux Saga behavior.

Use `providers.dynamic(fn)` for computed values and `providers.throwError(error)` to throw from a provider.

### Assertions

Assertion methods are chainable. Prefix an assertion with `.not` to negate it.

#### Effect assertions

The following methods assert that a matching effect was yielded:

- `.actionChannel(patternOrChannel)`
- `.apply(context, fn, args)`
- `.call(fn, ...args)`
- `.cps(fn, ...args)`
- `.fork(fn, ...args)`
- `.getContext(property)`
- `.put(action)`
- `.putResolve(action)`
- `.race(effects)`
- `.select(selector, ...args)`
- `.setContext(properties)`
- `.spawn(fn, ...args)`
- `.take(pattern)`
- `.takeMaybe(pattern)`

Each effect assertion receives the same arguments as the corresponding Redux Saga effect creator.

#### Partial effect matching

The effect assertions also expose `.like` partial matchers:

- `.call.like({ fn })`
- `.apply.like({ fn })`
- `.cps.like({ fn })`
- `.fork.like({ fn })`
- `.spawn.like({ fn })`
- `.put.like({ action })`
- `.putResolve.like({ action })`
- `.race.like({ effects })`
- `.select.like({ selector })`
- `.take.like({ pattern })`
- `.actionChannel.like({ pattern })`

Convenience matchers include:

- `.call.fn(fn)`
- `.apply.fn(fn)`
- `.cps.fn(fn)`
- `.fork.fn(fn)`
- `.spawn.fn(fn)`
- `.put.actionType(type)`
- `.putResolve.actionType(type)`
- `.select.selector(selector)`
- `.actionChannel.pattern(pattern)`

```js
expectSaga(saga)
  .call.fn(fetchUser)
  .put.actionType('RECEIVE_USER')
  .run();
```

#### `.returns(value)`

Asserts that the saga returned `value`.

#### `.throws(errorOrType)`

Asserts that the saga threw an error. The argument may be an error object or an error constructor/type.

#### `.hasFinalState(state)`

Asserts the final reducer state after the saga finishes.

#### `.not`

Negates the next assertion.

```js
expectSaga(saga)
  .not.put({ type: 'FAILURE' })
  .run();
```

## `testSaga(saga, ...sagaArgs)`

Creates a unit test that steps through `saga`, passing `sagaArgs` to the initial iterator.

```js
testSaga(userSaga, id)
  .next()
  .call(fetchUser, id)
  .next(user)
  .put(receiveUser(user))
  .next()
  .isDone();
```

### Stepping through the saga

#### `.next(value?)`

Advances the saga. The optional value is passed back into the generator as the result of the previous `yield`.

#### `.finish(value?)`

Advances the saga as if the previous yield completed with `value`, intended for finishing the saga.

#### `.throw(error)`

Throws `error` into the saga at the current yield point.

#### `.back(n = 1)`

Moves back `n` steps in the recorded history.

#### `.restart(...args?)`

Restarts the saga. If arguments are supplied, they replace the original saga arguments.

#### `.save(name)`

Saves the current position under `name`.

#### `.restore(name)`

Restores a previously saved position.

### Unit-test effect assertions

After `.next()`, `.finish()`, or `.throw(error)`, assert the yielded effect with one of:

- `.actionChannel(...)`
- `.all(...)`
- `.apply(...)`
- `.call(...)`
- `.cancel(...)`
- `.cancelled()`
- `.cps(...)`
- `.debounce(...)`
- `.delay(...)`
- `.flush(...)`
- `.fork(...)`
- `.getContext(...)`
- `.join(...)`
- `.put(...)`
- `.putResolve(...)`
- `.race(...)`
- `.select(...)`
- `.setContext(...)`
- `.spawn(...)`
- `.take(...)`
- `.takeEvery(...)`
- `.takeLatest(...)`
- `.takeLeading(...)`
- `.takeMaybe(...)`
- `.throttle(...)`
- `.retry(...)`

These assertions compare the yielded effect with the corresponding Redux Saga effect creator.

Additional yielded-value assertions are:

- `.is(value)`: compare the yielded value with `value`
- `.inspect(fn)`: call `fn` with the yielded value for custom assertions
- `.isDone()`: assert the saga is done
- `.returns(value)`: assert the saga is done and returned `value`

## `matchers`

`redux-saga-test-plan/matchers` exports matcher versions of Redux Saga effect creators for use with `expectSaga` assertions and providers.

Available matchers include:

- `actionChannel`
- `apply`
- `call`
- `cancel`
- `cancelled`
- `cps`
- `flush`
- `fork`
- `getContext`
- `join`
- `put`
- `putResolve`
- `race`
- `select`
- `setContext`
- `spawn`
- `take`
- `takeMaybe`

Partial-matching helpers are available on the same matcher functions where applicable:

- `call.fn(fn)` / `call.like(object)`
- `apply.fn(fn)` / `apply.like(object)`
- `cps.fn(fn)` / `cps.like(object)`
- `fork.fn(fn)` / `fork.like(object)`
- `spawn.fn(fn)` / `spawn.like(object)`
- `put.actionType(type)` / `put.like(object)`
- `putResolve.actionType(type)` / `putResolve.like(object)`
- `select.selector(selector)` / `select.like(object)`
- `actionChannel.pattern(pattern)` / `actionChannel.like(object)`

```js
import * as matchers from 'redux-saga-test-plan/matchers';

expectSaga(saga)
  .provide([[matchers.call.fn(fetchUser), user]])
  .run();
```

## `providers`

`redux-saga-test-plan/providers` exports helpers for building dynamic providers.

### `dynamic(fn)`

Creates a provider value computed by `fn`. The function receives the yielded effect and related provider arguments.

### `throwError(error)`

Creates a dynamic provider that throws `error`, useful for testing error handling.

### `composeProviders(providers)`

Composes an object of provider functions into one provider pipeline. Providers are evaluated in object key order and can delegate with `next()`.

```js
import { composeProviders } from 'redux-saga-test-plan/providers';

const provider = composeProviders({
  call(effect, next) {
    return effect.fn === fetchUser ? user : next();
  },
});
```

## Result object

The promise returned by `.run()` and `.silentRun()` resolves to a result object suitable for assertions and snapshots:

```js
const result = await expectSaga(saga).run();

expect(result.returnValue).toBe(42);
expect(result.storeState).toEqual({ ready: true });
expect(result.effects.call).toHaveLength(1);
expect(result.allEffects.length).toBeGreaterThan(0);
expect(result.toJSON()).toMatchSnapshot();
```
