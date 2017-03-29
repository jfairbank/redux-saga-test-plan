# Mocking

Sometimes integration testing sagas can be laborious, especially when you have
to mock server APIs for `call` or create fake state and selectors to use with
`select`.

To make tests simpler, Redux Saga Test Plan allows you to intercept and handle
effect creators instead of letting Redux Saga handle them. This is similar to a
middleware layer that Redux Saga Test Plan calls _providers_.

To use providers, you can call the `provide` method. The `provide` method takes
one argument, an object literal with effect creator names as keys and function
handlers as arguments. Each function handler takes two arguments, the yielded
effect and a `next` callback. You can inspect the effect and return a fake value
based on the properties in the effect. If you don't want to handle the effect
yourself, you can pass it on to Redux Saga by invoking the `next` callback
parameter.

Here is an example with Jest to show you how to supply a fake value for an API
call:

```js
import { call, put, take } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import api from 'my-api';

function* saga() {
  const action = yield take('REQUEST_USER');
  const id = action.payload;

  const user = yield call(api.fetchUser, id);

  yield put({ type: 'RECEIVE_USER', payload: user });
}

it('provides a value for the API call', () => {
  return expectSaga(saga)
    .provide({
      call(effect, next) {
        // Check for the API call to return fake value
        if (effect.fn === api.fetchUser) {
          const id = effect.args[0];
          return { id, name: 'John Doe' };
        }

        // Allow Redux Saga to handle other `call` effects
        return next();
      },
    })
    .put({
      type: 'RECEIVE_USER',
      payload: { id: 1, name: 'John Doe' },
    })
    .dispatch({ type: 'REQUEST_USER', payload: 1 })
    .run();
});
```

## Effect Creators

Even though you'll probably never need them all, you can supply a provider for
almost every effect creator\*:

- `actionChannel`
- `call`
- `cancel`
- `cancelled`
- `cps`
- `flush`
- `fork`
- `join`
- `parallel` (handle yielded arrays)
- `put`
- `race`
- `select`
- `spawn`
- `take`


\*Because there is no way to distinguish the `apply` and `call` effects, you

\*To handle `take.maybe` and `put.resolve`, use the `take` and `put` providers,
respectively. You can inspect `take` effects for the `maybe` property and `put`
effects for the `resolve` property.

## Examples

#### Select

```js
import { put, select } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { selectors } from 'my-selectors';

function* saga() {
  const name = yield select(selectors.getName);
  const age = yield select(selectors.getAge);

  yield put({ type: 'USER', payload: { name, age } });
}

it('provides a value for the selector', () => {
  return expectSaga(saga)
    .provide({
      select({ selector }, next) {
        if (selector === selectors.getName) {
          return 'Tucker';
        }

        if (selector === selectors.getAge) {
          return 11;
        }

        return next();
      },
    })
    .put({
      type: 'USER',
      payload: { name: 'Tucker', age: 11 },
    })
    .run();
});
```

#### Parallel Effects

Providers work on effects yielded inside an array:

```js
import { put, select } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { selectors } from 'my-selectors';

function* saga() {
  const [name, age] = yield [
    select(selectors.getName),
    select(selectors.getAge),
  ];

  yield put({ type: 'USER', payload: { name, age } });
}

it('provides values for effects inside arrays', () => {
  return expectSaga(saga)
    .provide({
      select({ selector }, next) {
        if (selector === selectors.getName) {
          return 'Tucker';
        }

        if (selector === selectors.getAge) {
          return 11;
        }

        return next();
      },
    })
    .put({
      type: 'USER',
      payload: { name: 'Tucker', age: 11 },
    })
    .run();
});
```

Or you can provide a value for the entire array of effects:

```js
import { put, select } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { selectors } from 'my-selectors';

function* saga() {
  const [name, age] = yield [
    select(selectors.getName),
    select(selectors.getAge),
  ];

  yield put({ type: 'USER', payload: { name, age } });
}

it('provides a value for the entire array', () => {
  return expectSaga(saga)
    .provide({
      parallel: () => ['Tucker', 11],
    })
    .put({
      type: 'USER',
      payload: { name: 'Tucker', age: 11 },
    })
    .run();
});
```

#### Race

```js
import { call, put, race, take } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import api from 'my-api';

const delay = time => (
  new Promise(resolve => setTimeout(resolve, time))
);

function* saga() {
  const action = yield take('REQUEST_USER');
  const id = action.payload;

  const { user } = yield race({
    user: call(api.fetchUser, id),
    timeout: call(delay, 500),
  });

  if (user) {
    yield put({ type: 'RECEIVE_USER', payload: user });
  } else {
    yield put({ type: 'TIMEOUT' });
  }
}

test('fetching the user succeeds', () => {
  const fakeUser = { id: 1, name: 'John Doe' };

  return expectSaga(saga)
    .provide({
      race: () => ({ user: fakeUser }),
    })
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .dispatch({ type: 'REQUEST_USER' })
    .run();
});

test('timeout wins', () => {
  return expectSaga(saga)
    .provide({
      race: () => ({ timeout: undefined }),
    })
    .put({ type: 'TIMEOUT' })
    .dispatch({ type: 'REQUEST_USER' })
    .run();
});
```

#### Errors

You can simulate errors by throwing from a provider:

```js
function* saga() {
  const action = yield take('REQUEST_USER');
  const id = action.payload;

  try {
    const user = yield call(api.fetchUser, id);

    yield put({ type: 'RECEIVE_USER', payload: user });
  } catch (e) {
    yield put({ type: 'FAIL_USER', error: e });
  }
}

it('can throw errors in the saga', () => {
  const error = new Error('Whoops...');

  return expectSaga(saga)
    .provide({
      call(effect, next) {
        if (effect.fn === api.fetchUser) {
          throw error;
        }

        return next();
      },
    })
    .put({ error, type: 'FAIL_USER' })
    .dispatch({ type: 'REQUEST_USER', payload: 1 })
    .run();
});
```

#### Providing in forked/spawned tasks

To ensure that the `fork` and `spawn` assertion methods work properly, providers
will not automatically work inside forked/spawned tasks. To provide values
inside forked/spawned tasks, include `provideInForkedTasks: true` as an
additional key-value pair in the providers object literal. **Note:** Redux Saga
Test Plan has to wrap forked/spawned sagas in a middleware saga to provide
values in them, so the `fork` and `spawn` assertion methods won't work properly
if you're providing values in forked/spawned tasks.

```js
import { fork, put } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import api from 'my-api';

function* fetchUserSaga() {
  const user = yield call(api.fetchUser);
  yield put({ type: 'RECEIVE_USER', payload: user });
}

function* forkingSaga() {
  yield fork(fetchUserSaga);
}

function* spawningSaga() {
  yield spawn(fetchUserSaga);
}

it('provides values in forked sagas', () => {
  return expectSaga(forkingSaga)
    .provide({
      provideInForkedTasks: true,

      call({ fn }, next) {
        if (fn === api.fetchUser) {
          return fakeUser;
        }

        return next();
      },
    })
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run();
});

it('provides values in spawned sagas', () => {
  return expectSaga(spawningSaga)
    .provide({
      provideInForkedTasks: true,

      call({ fn }, next) {
        if (fn === api.fetchUser) {
          return fakeUser;
        }

        return next();
      },
    })
    .put({ type: 'RECEIVE_USER', payload: fakeUser })
    .run();
});
```

#### More

For some more contrived examples of providers, look in the
[`expectSaga/provide.test.js` file](https://github.com/jfairbank/redux-saga-test-plan/tree/master/__tests__/expectSaga/provide.test.js)
