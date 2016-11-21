# Effect Creators

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
