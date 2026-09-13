# API Reference

This page documents the complete public API of `redux-saga-test-plan`. The
package exports three things from its entry point:

```js
import { expectSaga, testSaga, matchers, providers } from 'redux-saga-test-plan';
```

`matchers` and `providers` are also available as standalone entry points:

```js
import * as matchers from 'redux-saga-test-plan/matchers';
import { dynamic, throwError, composeProviders } from 'redux-saga-test-plan/providers';
```

## Table of contents

* [Main exports](#main-exports)
* [expectSaga](#expectsaga)
  * [Configuration methods](#configuration-methods)
  * [Effect assertions](#effect-assertions)
  * [Sub-match helpers](#sub-match-helpers)
  * [The result](#the-result)
* [testSaga](#testsaga)
  * [Stepping through the saga](#stepping-through-the-saga)
  * [Effect assertions](#testsaga-effect-assertions)
  * [Time travel](#time-travel)
* [matchers](#matchers)
* [providers](#providers)

## Main exports

| export | description |
| ------ | ----------- |
| `expectSaga(saga, ...sagaArgs)` | Integration-test a saga by actually running it. Chainable API; call `.run()` to start. |
| `testSaga(saga, ...sagaArgs)` | Unit-test a saga by stepping the generator directly. Chainable API; every `next()` advances one step. |
| `matchers` | Effect matchers used with `provide()`, e.g. `matchers.call.fn(fn)`. |
| `providers` | Helpers for `provide()`: `dynamic`, `throwError`, `composeProviders`. |

## expectSaga

`expectSaga(saga, ...sagaArgs)` returns a chainable API. Extra arguments are
passed to `saga` when it runs.

```js
expectSaga(userSaga, api, userId)
  .withState({ users: {} })
  .dispatch({ type: 'REQUEST_USER', payload: { id: 1 } })
  .put({ type: 'RECEIVE_USER', payload: fakeUser })
  .run()
  .then(result => { /* assertions on the result */ });
```

### Configuration methods

| method | description |
| ------ | ----------- |
| `withState(state)` | Replace the reducer with a default reducer seeded with `state`. Equivalent to asserting a single final state. |
| `withReducer(reducer, initialState?)` | Run the saga against a real reducer, optionally with an initial state. |
| `provide(staticProviders)` | Provide matches for effects so they resolve to static values instead of running. Accepts an array of `[matcher, value]` tuples. |
| `provide(dynamicProviders)` | Same, but with a function `(callEffect, effects) => value` for dynamic behavior. |
| `dispatch(action)` | Dispatch raw actions into the saga's store. Matches `take` effects by pattern. |
| `not` | A getter that flips the next effect assertion into a negation, e.g. `.not.call(fn)`. |
| `returns(value)` | Assert the saga's final return value. |
| `throws(error)` | Assert the saga throws the given `error`. |
| `hasFinalState(expectedState)` | Assert the final state of the store equals `expectedState`. |
| `delay(ms)` | Aliases `call(delay, ms)`; assert the saga delays. |
| `run(timeout?)` | Start the saga and resolve (or reject) with a [result](#the-result) `Promise`. `timeout` defaults to 250ms. |
| `silentRun(timeout?)` | Like `run`, but rejects with a plain, less noisy error on assertion failure. |

### Effect assertions

These assertion methods are chainable and settle as the saga runs. Each one
accepts the same arguments as the corresponding effect creator.

`put`, `putResolve`, `call`, `apply`, `cps`, `fork`, `spawn`, `select`,
`take`, `takeMaybe`, `actionChannel`, `race`, `getContext`, `setContext`

Because effects use argument identity (a bare `call(fn)` only matches
`call(fn)` at the same position), there are also fuzzy sub-match helpers below.

### Sub-match helpers

Each effect assertion exposes a `like` variant that does partial matching:

| helper | matches by |
| ------ | ---------- |
| `call.like({ fn, args })` | a `call` to `fn` (and optionally `args`) |
| `call.fn(fn)` | a `call` to `fn`, any args |
| `apply.fn(fn)` | an `apply` with bound `fn` |
| `cps.fn(fn)` | a `cps` call to `fn` |
| `fork.fn(fn)` | a `fork` of `fn` |
| `spawn.fn(fn)` | a `spawn` of `fn` |
| `put.like({ action })` / `put.actionType(type)` | a `put` of any action with `type` (`putResolve` too) |
| `select.like({ selector })` / `select.selector(fn)` | a `select` with the given selector |
| `actionChannel.pattern(pattern)` | an `actionChannel` for `pattern` |
| `take.like({ pattern })` / `take.pattern(pattern)` | a `take` for `pattern` (`takeMaybe` too) |

### The result

`run()` resolves with a result object:

| key | description |
| --- | ----------- |
| `effects` | An object of `{ name: [...effects] }` for every effect the saga yielded, running a default reducer. |
| `storeState` | The final state of the store (from the result object's `storeState` property). |
| `returnValue` | The saga's return value. |
| `invokeError` | An error thrown during long-running saga invocation, if any. |
| `warnings` | Array of warnings, e.g. for unhandled `take` effects that never got an action. |

It also exposes `.toPromise()`. Note: `expectSaga` assertions only pass the
exact effects that are declared; unlisted effects are not asserted.

## testSaga

`testSaga(saga, ...sagaArgs)` returns a chainable API that drives the
generator directly, so effects are asserted strictly, in order.

```js
testSaga(userSaga, api, 1)
  .next()
  .call(api.get, 1)
  .next(fakeUser)
  .put({ type: 'RECEIVE_USER', payload: fakeUser })
  .next()
  .isDone();
```

### Stepping through the saga

| method | description |
| ------ | ----------- |
| `next(...args)` | Advance the generator one step; arguments become the yielded value from `redux-saga`. Returns the assertion chain. |
| `finish()` | Advance the generator until it returns, verifying it completes. |
| `restart(...sagaArgs?)` | Restart the saga from the top, optionally with new arguments. |
| `throw(error)` | Throw `error` into the generator (as if a yielded promise rejected). |
| `back(label?)` | Move history back (optionally to a saved point). |
| `save(label)` | Save the current position under `label`. |
| `restore(label)` | Restore to the position saved under `label`. |

### testSaga effect assertions

Available after `.next(...)`, accepting the same arguments as the effect
creators (strict equality):

`apply`, `call`, `cps`, `delay`, `fork`, `spawn`, `cancel`, `cancelled`,
`put`, `putResolve`, `race`, `select`, `take`, `takeMaybe`, `actionChannel`,
`all`, `flush`, `join`, `getContext`, `setContext`

Saga helpers are matched too: `takeEvery`, `takeLatest`, `takeLeading`,
`throttle`, `debounce`, `retry`.

General assertions:

| method | description |
| ------ | ----------- |
| `isDone()` | Assert the saga has finished (no more steps). |
| `is(value)` | Assert the saga's final return value is `value`. |
| `returns(value, done?)` | Assert the saga returns `value` (optionally waiting extra turns). |
| `inspect()` | Inspect the current yielded value and position. |

## matchers

`matchers` mirrors every effect creator but generates *partial* matchers used
with `provide()`. Each matcher also exposes type-specific helpers like
`fn`, `like`, `actionType`, `pattern`, `selector`.

```js
import { call, put, take } from 'redux-saga-test-plan/matchers';

expectSaga(saga)
  .provide([
    [call.fn(api.get), fakeUser],
    [call(api.get, 1), fakeUser],
  ])
  .run();
```

| matcher | matches |
| ------- | ------- |
| `call.fn(fn)` / `call.like({ fn, args })` | a `call` to `fn` (any args) / with given `fn` and optional `args` |
| `apply.fn(fn)` / `apply.like(...)` | an `apply` of `fn` |
| `cps.fn(fn)` / `cps.like(...)` | a `cps` callback call to `fn` |
| `fork.fn(fn)` / `fork.like(...)` | a `fork` of `fn` |
| `spawn.fn(fn)` / `spawn.like(...)` | a `spawn` of `fn` |
| `put.actionType(type)` / `put.like({ action })` | a `put` of an action with `type` |
| `select.selector(fn)` / `select.like({ selector })` | a `select` with selector `fn` |
| `take.pattern(pattern)` / `take.like({ pattern })` | a `take` for `pattern` |
| `takeMaybe.pattern(pattern)` / `takeMaybe.like({ pattern })` | a `takeMaybe` for `pattern` |
| `actionChannel.pattern(pattern)` | an `actionChannel` for `pattern` |

Every other effect also has a matcher (`cancel`, `cancelled`, `flush`,
`join`, `race`, `actionChannel`, `getContext`, `setContext`) with its
`like(...)` sub-matcher.

## providers

`providers` are helpers for the `provide()` method:

| helper | description |
| ------ | ----------- |
| `dynamic(fn)` | `fn(callEffect, effects)` returns the provided value for an effect, letting you inspect the actual effect and other effects. |
| `throwError(error)` | Throws `error` for a matched effect. |
| `composeProviders(...providers)` | Combine multiple static/dynamic providers into one array for `provide()`. |

```js
import { provide, throwError } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';

expectSaga(saga)
  .provide([
    [matchers.call.fn(api.get), throwError(new Error('boom'))],
  ])
  .run();
```