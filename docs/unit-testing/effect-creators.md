# Effect Creator Assertions

The `testSaga` API has assertions for all the effect creators available in Redux
Saga. You can reference them in Redux Saga's docs
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
- `all([...effects])`
- `race(effects)`
- `takem(pattern)` **DEPRECATED:** Use `take.maybe`
- `takem(channel)` **DEPRECATED:** Use `take.maybe`
