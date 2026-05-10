# API Reference

Redux Saga Test Plan exports two main test builders:

```js
import {expectSaga, testSaga} from 'redux-saga-test-plan';
```

It also exports helper modules for matching and providing effects:

```js
import * as matchers from 'redux-saga-test-plan/matchers';
import * as providers from 'redux-saga-test-plan/providers';
```

## `expectSaga(saga, ...args)`

Use `expectSaga` for integration-style saga tests. It runs the saga with Redux
Saga, lets you dispatch actions, mock effects, assert yielded effects, and
inspect the final result.

```js
return expectSaga(fetchUser, api, 42)
  .provide([[call(api.fetchUser, 42), {id: 42, name: 'Tucker'}]])
  .put({type: 'RECEIVE_USER', payload: {id: 42, name: 'Tucker'}})
  .run();
```

### Lifecycle and configuration

| Method | Description |
| ------ | ----------- |
| `.run([timeoutOrConfig])` | Starts the saga and returns a Promise for the result object. Defaults to `expectSaga.DEFAULT_TIMEOUT`. Pass a number, `false`, or `{timeout, silenceTimeout}`. |
| `.silentRun([timeout])` | Runs the saga like `.run()`, but suppresses timeout warnings. |
| `.withState(state)` | Sets the initial state returned by `select` effects. |
| `.withReducer(reducer[, initialState])` | Runs dispatched actions through a reducer and uses its final state for `hasFinalState`. |
| `.provide(providers)` | Supplies static provider pairs or dynamic provider handlers for mocked effects. |
| `.dispatch(action)` | Queues or dispatches an action into the running saga. |
| `.delay(ms)` | Delays the next `.dispatch(action)` by the given number of milliseconds. |
| `.returns(value)` | Asserts that the top-level saga returns `value`. |
| `.throws(errorOrConstructor)` | Asserts that the top-level saga throws the given error or error type. |
| `.hasFinalState(state)` | Asserts that the reducer-managed final state equals `state`. |
| `.not` | Negates the next expectation, such as `.not.put(action)`. |

### Effect assertions

These methods assert that the saga yielded a matching effect:

| Method | Description |
| ------ | ----------- |
| `.actionChannel(pattern[, buffer])` | Asserts an `actionChannel` effect. |
| `.apply(context, fn, args)` | Asserts an `apply` effect. |
| `.call(fn, ...args)` | Asserts a `call` effect. |
| `.cps(fn, ...args)` | Asserts a `cps` effect. |
| `.fork(fn, ...args)` | Asserts a `fork` effect. |
| `.getContext(prop)` | Asserts a `getContext` effect. |
| `.put(action)` | Asserts a `put` effect. |
| `.putResolve(action)` | Asserts a resolving `put` effect. |
| `.race(effects)` | Asserts a `race` effect. |
| `.select(selector, ...args)` | Asserts a `select` effect. |
| `.setContext(props)` | Asserts a `setContext` effect. |
| `.spawn(fn, ...args)` | Asserts a detached `fork`/`spawn` effect. |
| `.take(pattern)` | Asserts a `take` effect. |
| `.takeMaybe(pattern)` | Asserts a `takeMaybe` effect. |

### Partial effect assertions

Some `expectSaga` effect assertions include helpers for partial matching:

| Method | Description |
| ------ | ----------- |
| `.actionChannel.like(partial)` | Matches part of an `actionChannel` effect descriptor. |
| `.actionChannel.pattern(pattern)` | Matches an `actionChannel` by pattern. |
| `.apply.like(partial)` | Matches part of an `apply`/`call` effect descriptor. |
| `.apply.fn(fn)` | Matches an `apply` by function. |
| `.call.like(partial)` | Matches part of a `call` effect descriptor. |
| `.call.fn(fn)` | Matches a `call` by function. |
| `.cps.like(partial)` | Matches part of a `cps` effect descriptor. |
| `.cps.fn(fn)` | Matches a `cps` by function. |
| `.fork.like(partial)` | Matches part of a `fork` effect descriptor. |
| `.fork.fn(fn)` | Matches a `fork` by function. |
| `.put.like(partial)` | Matches part of a `put` effect descriptor. |
| `.put.actionType(type)` | Matches a `put` by `action.type`. |
| `.putResolve.like(partial)` | Matches part of a resolving `put` effect descriptor. |
| `.putResolve.actionType(type)` | Matches a resolving `put` by `action.type`. |
| `.select.like(partial)` | Matches part of a `select` effect descriptor. |
| `.select.selector(selector)` | Matches a `select` by selector. |
| `.spawn.like(partial)` | Matches part of a detached `fork`/`spawn` effect descriptor. |
| `.spawn.fn(fn)` | Matches a `spawn` by function. |

### Run result

The Promise returned by `.run()` and `.silentRun()` resolves with:

| Property | Description |
| -------- | ----------- |
| `storeState` | The final reducer state. |
| `returnValue` | The top-level saga's return value. |
| `effects` | Yielded effects grouped by effect type. |
| `allEffects` | All captured effects in yield order. |
| `toJSON()` | Serializes the grouped `effects` object for snapshot tests. |

`expectSaga.DEFAULT_TIMEOUT` is the default async timeout in milliseconds.

## `testSaga(saga, ...args)`

Use `testSaga` for step-by-step unit tests. It advances the generator manually
and asserts the yielded value at each step.

```js
testSaga(fetchUser, api, 42)
  .next()
  .call(api.fetchUser, 42)
  .next({id: 42, name: 'Tucker'})
  .put({type: 'RECEIVE_USER', payload: {id: 42, name: 'Tucker'}})
  .next()
  .isDone();
```

### Progress and history

| Method | Description |
| ------ | ----------- |
| `.next([value])` | Advances the saga with an optional value. |
| `.throw(error)` | Throws an error into the saga. |
| `.finish([value])` | Finishes the saga by calling `iterator.return(value)`. |
| `.back([n])` | Moves back `n` yielded steps. Defaults to one step. |
| `.save(name)` | Saves the current position with a name. |
| `.restore(name)` | Restores a previously saved position. |
| `.restart(...args)` | Restarts the saga. When arguments are provided, they replace the original saga arguments. |

### Effect assertions

After `.next()`, `.throw()`, or `.finish()`, use these methods to assert the
current yielded effect:

| Method | Description |
| ------ | ----------- |
| `.actionChannel(pattern[, buffer])` | Asserts an `actionChannel` effect. |
| `.all(effects)` | Asserts an `all` effect. |
| `.apply(context, fn, args)` | Asserts an `apply` effect. |
| `.call(fn, ...args)` | Asserts a `call` effect. |
| `.cancel(task)` | Asserts a `cancel` effect. |
| `.cancelled()` | Asserts a `cancelled` effect. |
| `.cps(fn, ...args)` | Asserts a `cps` effect. |
| `.debounce(ms, pattern, saga, ...args)` | Asserts a `debounce` helper effect. |
| `.delay(ms[, value])` | Asserts a `delay` effect. |
| `.flush(channel)` | Asserts a `flush` effect. |
| `.fork(fn, ...args)` | Asserts a `fork` effect. |
| `.getContext(prop)` | Asserts a `getContext` effect. |
| `.join(...tasks)` | Asserts a `join` effect. |
| `.put(action)` | Asserts a `put` effect. |
| `.putResolve(action)` | Asserts a resolving `put` effect. |
| `.race(effects)` | Asserts a `race` effect. |
| `.retry(maxTries, delayLength, fn, ...args)` | Asserts a `retry` helper effect. |
| `.select(selector, ...args)` | Asserts a `select` effect. |
| `.setContext(props)` | Asserts a `setContext` effect. |
| `.spawn(fn, ...args)` | Asserts a detached `fork`/`spawn` effect. |
| `.take(pattern)` | Asserts a `take` effect. |
| `.takeEvery(pattern, saga, ...args)` | Asserts a `takeEvery` helper effect. |
| `.takeLatest(pattern, saga, ...args)` | Asserts a `takeLatest` helper effect. |
| `.takeLeading(pattern, saga, ...args)` | Asserts a `takeLeading` helper effect. |
| `.takeMaybe(pattern)` | Asserts a `takeMaybe` effect. |
| `.throttle(ms, pattern, saga, ...args)` | Asserts a `throttle` helper effect. |

### Value assertions

| Method | Description |
| ------ | ----------- |
| `.is(value)` | Asserts that the yielded value deeply equals `value`. |
| `.inspect(fn)` | Passes the yielded value to `fn` for custom assertions. |
| `.isDone()` | Asserts that the saga is finished. |
| `.returns(value)` | Asserts that the saga returned `value` and is finished. |

## `matchers`

Import matchers when using static providers with `.provide([...])`.

```js
import * as matchers from 'redux-saga-test-plan/matchers';
```

| Matcher | Description |
| ------- | ----------- |
| `matchers.actionChannel(pattern[, buffer])` | Matches an `actionChannel` effect. |
| `matchers.apply(context, fn, args)` | Matches an `apply` effect. |
| `matchers.call(fn, ...args)` | Matches a `call` effect. |
| `matchers.cancel(task)` | Matches a `cancel` effect. |
| `matchers.cancelled()` | Matches a `cancelled` effect. |
| `matchers.cps(fn, ...args)` | Matches a `cps` effect. |
| `matchers.flush(channel)` | Matches a `flush` effect. |
| `matchers.fork(fn, ...args)` | Matches a `fork` effect. |
| `matchers.getContext(prop)` | Matches a `getContext` effect. |
| `matchers.join(task)` | Matches a `join` effect. |
| `matchers.put(action)` | Matches a `put` effect. |
| `matchers.putResolve(action)` | Matches a resolving `put` effect. |
| `matchers.race(effects)` | Matches a `race` effect. |
| `matchers.select(selector, ...args)` | Matches a `select` effect. |
| `matchers.setContext(props)` | Matches a `setContext` effect. |
| `matchers.spawn(fn, ...args)` | Matches a detached `fork`/`spawn` effect. |
| `matchers.take(pattern)` | Matches a `take` effect. |
| `matchers.takeMaybe(pattern)` | Matches a `takeMaybe` effect. |

### Partial matchers

| Matcher | Description |
| ------- | ----------- |
| `matchers.actionChannel.like(partial)` | Matches part of an `actionChannel` effect descriptor. |
| `matchers.actionChannel.pattern(pattern)` | Matches an `actionChannel` by pattern. |
| `matchers.apply.like(partial)` | Matches part of an `apply`/`call` effect descriptor. |
| `matchers.apply.fn(fn)` | Matches an `apply` by function. |
| `matchers.call.like(partial)` | Matches part of a `call` effect descriptor. |
| `matchers.call.fn(fn)` | Matches a `call` by function. |
| `matchers.cps.like(partial)` | Matches part of a `cps` effect descriptor. |
| `matchers.cps.fn(fn)` | Matches a `cps` by function. |
| `matchers.fork.like(partial)` | Matches part of a `fork` effect descriptor. |
| `matchers.fork.fn(fn)` | Matches a `fork` by function. |
| `matchers.put.like(partial)` | Matches part of a `put` effect descriptor. |
| `matchers.put.actionType(type)` | Matches a `put` by `action.type`. |
| `matchers.putResolve.like(partial)` | Matches part of a resolving `put` effect descriptor. |
| `matchers.putResolve.actionType(type)` | Matches a resolving `put` by `action.type`. |
| `matchers.select.like(partial)` | Matches part of a `select` effect descriptor. |
| `matchers.select.selector(selector)` | Matches a `select` by selector. |
| `matchers.spawn.like(partial)` | Matches part of a detached `fork`/`spawn` effect descriptor. |
| `matchers.spawn.fn(fn)` | Matches a `spawn` by function. |

## `providers`

Import provider helpers when mocking effects in `expectSaga`.

```js
import {composeProviders, dynamic, throwError} from 'redux-saga-test-plan/providers';
```

| Helper | Description |
| ------ | ----------- |
| `providers.dynamic(fn)` | Wraps a static provider value so `fn(effect, next)` can compute the provided value dynamically. |
| `providers.throwError(error)` | Wraps an error so a static provider throws it from the matched effect. |
| `providers.composeProviders(...providers)` | Combines dynamic provider functions and uses the first provider that handles the effect. |

Dynamic provider objects passed to `.provide({ ... })` can handle these provider
keys:

```js
actionChannel, all, call, cancel, cancelled, cps, flush, fork, getContext,
join, put, race, select, setContext, spawn, take
```

Use the `call` provider for `apply` effects, the `put` provider for
`putResolve` effects, and the `take` provider for `takeMaybe` effects.
