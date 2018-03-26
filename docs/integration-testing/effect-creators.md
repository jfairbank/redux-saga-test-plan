# Effect Creator Assertions

The `expectSaga` API has assertions for most of the effect creators available in
Redux Saga. You can reference effect creators in Redux Saga's docs
[here](http://redux-saga.github.io/redux-saga/docs/api/index.html#effect-creators).

- `take(pattern)`
- `take.maybe(pattern)`
- `put(action)`
- `put.resolve(action)`
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
- `select(selector, ...args)`
- `actionChannel(pattern, [buffer])`
- `race(effects)`
- `setContext(props)`
- `getContext(prop)`

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
