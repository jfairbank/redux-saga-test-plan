# Testing Framework Examples

Redux Saga Test Plan works with any runner that can execute synchronous
assertions and wait for a Promise. Use `expectSaga` for integration-style tests
and return its `.run()` Promise from asynchronous tests. Use `testSaga` when you
want a synchronous step-by-step unit test.

The examples below use the same saga:

```js
import {call, put} from 'redux-saga/effects';

export function* fetchUser(api, id) {
  const user = yield call(api.fetchUser, id);
  yield put({type: 'RECEIVE_USER', payload: user});
  return user;
}
```

## Jest

Jest waits for the Promise returned from the test.

```js
import {expectSaga, testSaga} from 'redux-saga-test-plan';
import {fetchUser} from './sagas';

test('fetches a user with expectSaga', () => {
  const api = {fetchUser: id => ({id, name: 'Tucker'})};

  return expectSaga(fetchUser, api, 42)
    .put({type: 'RECEIVE_USER', payload: {id: 42, name: 'Tucker'}})
    .run();
});

test('fetches a user with testSaga', () => {
  const api = {fetchUser() {}};
  const user = {id: 42, name: 'Tucker'};

  testSaga(fetchUser, api, 42)
    .next()
    .call(api.fetchUser, 42)
    .next(user)
    .put({type: 'RECEIVE_USER', payload: user})
    .next(user)
    .isDone();
});
```

## Mocha

Mocha also waits for a returned Promise. Use any assertion library you already
use with Mocha for surrounding checks.

```js
import {expectSaga, testSaga} from 'redux-saga-test-plan';
import {fetchUser} from './sagas';

describe('fetchUser', () => {
  it('fetches a user with expectSaga', () => {
    const api = {fetchUser: id => ({id, name: 'Tucker'})};

    return expectSaga(fetchUser, api, 42)
      .put({type: 'RECEIVE_USER', payload: {id: 42, name: 'Tucker'}})
      .run();
  });

  it('fetches a user with testSaga', () => {
    const api = {fetchUser() {}};
    const user = {id: 42, name: 'Tucker'};

    testSaga(fetchUser, api, 42)
      .next()
      .call(api.fetchUser, 42)
      .next(user)
      .put({type: 'RECEIVE_USER', payload: user})
      .next(user)
      .isDone();
  });
});
```

## Jasmine

Jasmine waits for a returned Promise in modern versions. If you are on an older
Jasmine setup, call `done` from the Promise callbacks.

```js
import {expectSaga, testSaga} from 'redux-saga-test-plan';
import {fetchUser} from './sagas';

describe('fetchUser', () => {
  it('fetches a user with expectSaga', () => {
    const api = {fetchUser: id => ({id, name: 'Tucker'})};

    return expectSaga(fetchUser, api, 42)
      .put({type: 'RECEIVE_USER', payload: {id: 42, name: 'Tucker'}})
      .run();
  });

  it('fetches a user with testSaga', () => {
    const api = {fetchUser() {}};
    const user = {id: 42, name: 'Tucker'};

    testSaga(fetchUser, api, 42)
      .next()
      .call(api.fetchUser, 42)
      .next(user)
      .put({type: 'RECEIVE_USER', payload: user})
      .next(user)
      .isDone();
  });
});
```

## Tape

Tape does not automatically wait for returned Promises, so end the test from
the Promise chain.

```js
import test from 'tape';
import {expectSaga, testSaga} from 'redux-saga-test-plan';
import {fetchUser} from './sagas';

test('fetches a user with expectSaga', t => {
  const api = {fetchUser: id => ({id, name: 'Tucker'})};

  expectSaga(fetchUser, api, 42)
    .put({type: 'RECEIVE_USER', payload: {id: 42, name: 'Tucker'}})
    .run()
    .then(() => t.end(), t.end);
});

test('fetches a user with testSaga', t => {
  const api = {fetchUser() {}};
  const user = {id: 42, name: 'Tucker'};

  testSaga(fetchUser, api, 42)
    .next()
    .call(api.fetchUser, 42)
    .next(user)
    .put({type: 'RECEIVE_USER', payload: user})
    .next(user)
    .isDone();

  t.pass('saga completed');
  t.end();
});
```

## AVA

AVA waits for a returned Promise. `testSaga` assertions can run directly in the
test body.

```js
import test from 'ava';
import {expectSaga, testSaga} from 'redux-saga-test-plan';
import {fetchUser} from './sagas';

test('fetches a user with expectSaga', t => {
  const api = {fetchUser: id => ({id, name: 'Tucker'})};

  return expectSaga(fetchUser, api, 42)
    .put({type: 'RECEIVE_USER', payload: {id: 42, name: 'Tucker'}})
    .run()
    .then(() => t.pass());
});

test('fetches a user with testSaga', t => {
  const api = {fetchUser() {}};
  const user = {id: 42, name: 'Tucker'};

  testSaga(fetchUser, api, 42)
    .next()
    .call(api.fetchUser, 42)
    .next(user)
    .put({type: 'RECEIVE_USER', payload: user})
    .next(user)
    .isDone();

  t.pass();
});
```
