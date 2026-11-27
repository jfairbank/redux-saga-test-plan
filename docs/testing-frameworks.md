# Testing Frameworks

Redux Saga Test Plan works with any JavaScript test framework. Because
`expectSaga` runs asynchronously, most examples `return` or `await` the promise
from `run()` so the framework waits for the saga to finish. `testSaga` is
synchronous, so those tests only need the framework's basic structure.

The examples below all test the same saga:

```js
import { call, put } from 'redux-saga/effects';
import { expectSaga, testSaga } from 'redux-saga-test-plan';

function fetchUser(id) {
  return fetch(`/users/${id}`).then(res => res.json());
}

function* fetchUserSaga(action) {
  const user = yield call(fetchUser, action.payload.id);

  yield put({ type: 'RECEIVE_USER', payload: user });
}
```

## Jest

[Jest](https://jestjs.io/) tests can return the `expectSaga` promise or use
`async`/`await`:

```js
it('fetches the user', () => {
  return expectSaga(fetchUserSaga, { payload: { id: 42 } })
    .put({ type: 'RECEIVE_USER', payload: { name: 'John Doe' } })
    .provide([[call(fetchUser, 42), { name: 'John Doe' }]])
    .run();
});
```

Or with `async`/`await` and `testSaga`:

```js
it('fetches the user with testSaga', async () => {
  const action = { payload: { id: 42 } };

  testSaga(fetchUserSaga, action)
    .next()
    .call(fetchUser, 42)
    .next({ name: 'John Doe' })
    .put({ type: 'RECEIVE_USER', payload: { name: 'John Doe' } })
    .next()
    .isDone();
});
```

## Mocha

With [Mocha](https://mochajs.org/), return the `expectSaga` promise from `it`
so Mocha waits for completion:

```js
it('fetches the user', () => {
  return expectSaga(fetchUserSaga, { payload: { id: 42 } })
    .put({ type: 'RECEIVE_USER', payload: { name: 'John Doe' } })
    .provide([[call(fetchUser, 42), { name: 'John Doe' }]])
    .run();
});
```

`testSaga` is synchronous, so no promise is needed:

```js
it('fetches the user with testSaga', () => {
  const action = { payload: { id: 42 } };

  testSaga(fetchUserSaga, action)
    .next()
    .call(fetchUser, 42)
    .next({ name: 'John Doe' })
    .put({ type: 'RECEIVE_USER', payload: { name: 'John Doe' } })
    .next()
    .isDone();
});
```

## Jasmine

[Jasmine](https://jasmine.github.io/) specs work the same way — return the
promise so the spec waits for the saga:

```js
it('fetches the user', () => {
  return expectSaga(fetchUserSaga, { payload: { id: 42 } })
    .put({ type: 'RECEIVE_USER', payload: { name: 'John Doe' } })
    .provide([[call(fetchUser, 42), { name: 'John Doe' }]])
    .run();
});
```

## Tape

With [Tape](https://github.com/substack/tape), end the test after awaiting the
`expectSaga` promise:

```js
const test = require('tape');

test('fetches the user', async (t) => {
  await expectSaga(fetchUserSaga, { payload: { id: 42 } })
    .put({ type: 'RECEIVE_USER', payload: { name: 'John Doe' } })
    .provide([[call(fetchUser, 42), { name: 'John Doe' }]])
    .run();

  t.end();
});
```

For `testSaga`, call `t.end()` synchronously:

```js
test('fetches the user with testSaga', (t) => {
  const action = { payload: { id: 42 } };

  testSaga(fetchUserSaga, action)
    .next()
    .call(fetchUser, 42)
    .next({ name: 'John Doe' })
    .put({ type: 'RECEIVE_USER', payload: { name: 'John Doe' } })
    .next()
    .isDone();

  t.end();
});
```

## AVA

With [AVA](https://github.com/avajs/ava), mark the test `async` and `await` the
`expectSaga` promise. AVA requires at least one assertion, so call `t.pass()`
after the saga assertions succeed — a failed saga assertion throws and fails
the test:

```js
import test from 'ava';

test('fetches the user', async (t) => {
  await expectSaga(fetchUserSaga, { payload: { id: 42 } })
    .put({ type: 'RECEIVE_USER', payload: { name: 'John Doe' } })
    .provide([[call(fetchUser, 42), { name: 'John Doe' }]])
    .run();

  t.pass();
});
```
