# Framework Examples

This folder contains the same `loadItem` saga tested with five different,
widely-used testing frameworks, so you can see how `redux-saga-test-plan`
plugs into each one:

| Framework | File | Run command (from the repository root) |
| --------- | ---- | -------------------------------------- |
| [Jest](https://jestjs.io/) | `examples/jest/loadItem.test.js` | `npx jest --config=examples/jest/jest.config.js --runInBand` |
| [Mocha](https://mochajs.org/) | `examples/mocha/loadItem.test.js` | `npx mocha examples/mocha/loadItem.test.js` |
| [tape](https://github.com/substack/tape) | `examples/tape/loadItem.test.js` | `npx tape examples/tape/loadItem.test.js` |
| [AVA](https://avajs.io/) | `examples/ava/loadItem.test.js` | `npx ava` |
| [Jasmine](https://jasmine.github.io/) | `examples/jasmine/loadItem.test.js` | `npx jasmine --config=examples/jasmine/jasmine.json` |

The shared saga lives in [`examples/sagas.js`](./sagas.js). Every example
covers the same ground with each framework:

- `expectSaga` integration testing: dispatch a `LOAD_ITEM` action, assert the
  saga performs the `call`, `select`, `delay`, and `put` effects, and returns
  cleanly.
- `matchers` + `provide`: stub the `api.fetchItem` call so the saga never
  touches the network, then assert the stubbed payload is put into the store.
- `testSaga` unit testing: drive the generator step by step, asserting the
  exact effect at every `next()`.

## Running everything in one command

From the repository root:

```sh
npm run test:examples
```

The script in `package.json` runs all five frameworks in sequence. Each
framework is a regular `devDependency` of the package, so `npm run test:examples`
works on any CI provider with a single line.

## Adding a new framework

1. Create `examples/<framework>/<name>.test.js` importing `../../lib`
   (the compiled package) and the shared saga from `../sagas`.
2. Use the shortest idiomatic API of that framework (they are all
   Promise-friendly, so `return expectSaga(...).run()` or `await` works).
3. Append the framework's run command to the `test:examples` script.