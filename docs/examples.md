# Examples

Prefer to look at code? The [`examples/`](../examples/) directory contains a
complete, runnable test for the same saga written with five of the most common
testing frameworks:

* [Jest](../examples/jest/loadItem.test.js)
* [Mocha](../examples/mocha/loadItem.test.js)
* [tape](../examples/tape/loadItem.test.js)
* [AVA](../examples/ava/loadItem.test.js)
* [Jasmine](../examples/jasmine/loadItem.test.js)

The shared saga lives in [`examples/sagas.js`](../examples/sagas.js). It waits
for a `LOAD_ITEM` action, reads an item id from the state, calls an API, and
puts the fetched item — covering `take`, `select`, `call`, `delay`, and `put`
so every example exercises `expectSaga`, `matchers`/`provide`, and `testSaga`.

## Running the examples

From the repository root, once the library is built:

```sh
npm install
npm run build
npm run test:examples
```

`test:examples` runs all five frameworks in order:

| Framework | Command |
| --------- | ------- |
| Jest | `npx jest --config=examples/jest/jest.config.js --runInBand` |
| Mocha | `npx mocha examples/mocha/loadItem.test.js` |
| tape | `npx tape examples/tape/loadItem.test.js` |
| AVA | `npx ava` |
| Jasmine | `npx jasmine --config=examples/jasmine/jasmine.json` |

The example suite is a single command — `npm run test:examples` — which runs
all five runners in order, so it plugs into any CI provider (Travis, GitHub
Actions, CircleCI, ...) with one line.

## The three techniques each example shows

### 1. `expectSaga` integration testing

Dispatch a real action, let the saga run through Redux Saga, and assert that
the effects happened.

```js
return expectSaga(loadItem)
  .withState({})
  .dispatch({ type: 'LOAD_ITEM', payload: { id: 7 } })
  .call.like({ fn: api.fetchItem, args: [7] })
  .put({ type: 'ITEM_LOADED', payload: { id: 7, name: 'Item 7' } })
  .run();
```

### 2. Stubbing effects with `matchers` + `provide`

Prevent a real network call by telling `expectSaga` what to resolve when a
matching effect is yielded.

```js
return expectSaga(loadItemStubbed)
  .withState({})
  .dispatch({ type: 'LOAD_ITEM', payload: { id: 9 } })
  .provide([[matchers.call.fn(api.fetchItem), { id: 9, name: 'Stubbed' }]])
  .put({ type: 'ITEM_LOADED', payload: { id: 9, name: 'Stubbed' }, stubbed: true })
  .run();
```

### 3. `testSaga` unit testing

Drive the generator step by step and assert the exact effect at every point.

```js
testSaga(loadItem)
  .next()
  .take('LOAD_ITEM')
  .next({ type: 'LOAD_ITEM', payload: { id: 3 } })
  .delay(1)
  .next()
  .select(getItemId, { type: 'LOAD_ITEM', payload: { id: 3 } })
  .next(3)
  .call(api.fetchItem, 3)
  .next({ id: 3, name: 'Item 3' })
  .put({ type: 'ITEM_LOADED', payload: { id: 3, name: 'Item 3' } })
  .next()
  .isDone();
```

## Porting to another framework

The examples intentionally use only the framework's own runners and a standard
`Promise`-based assertion pattern, so porting to another runner is mechanical:

1. Copy `examples/<framework>/loadItem.test.js` to your framework's folder.
2. Keep the `expectSaga`/`testSaga` calls exactly as is; adapt only the
   enclosing `describe`/`it`/`test` wrapper and the assertion helpers.
3. Register the framework in `package.json` (`test:examples`) and in the CI
   workflow so it stays verified.