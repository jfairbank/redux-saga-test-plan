# Dynamic Providers

You can use completely dynamic providers by passing in an object literal to the
`provide` method. The object literal argument must contain effect creator names
as keys and function handlers as values. Each function handler takes two
arguments, the yielded effect and a `next` callback. You can inspect the effect
and return a fake value based on the properties in the effect. If you don't want
to handle the effect yourself, you can pass it on to Redux Saga by invoking the
`next` callback parameter.

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

- `all` \*\*
- `actionChannel`
- `call`
- `cancel`
- `cancelled`
- `cps`
- `flush`
- `fork`
- `getContext`
- `join`
- `put`
- `race`
- `select`
- `setContext`
- `spawn`
- `take`


\*Because there is no way to distinguish the `apply` and `call` effects, you
must handle `apply` effects with the `call` provider function.

\*To handle `take.maybe` and `put.resolve`, use the `take` and `put` providers,
respectively. You can inspect `take` effects for the `maybe` property and `put`
effects for the `resolve` property.

\*\* `all` will provide values for a yielded `all` effect as well as a yielded
array. **NOTE:** yielding an array is deprecated in Redux Saga, so this
functionality will be removed when Redux Saga removes support for yielded
arrays.

## Other Examples

### Select

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

### Parallel Effects via `all`

Providers work on effects yielded inside an `all` effect.

```js
import { all, put, select } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { selectors } from 'my-selectors';

function* saga() {
  const [name, age] = yield all([
    select(selectors.getName),
    select(selectors.getAge),
  ]);

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

Or you can provide a value for the entire array of effects via the `all`
provider:

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
      all: () => ['Tucker', 11],
    })
    .put({
      type: 'USER',
      payload: { name: 'Tucker', age: 11 },
    })
    .run();
});
```

### Parallel Effects via an Array

Providers work on effects yielded inside an array. **NOTE:** yielding an array
is deprecated in Redux Saga, so this functionality will be removed when Redux
Saga removes support for yielded arrays.

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

Or you can provide a value for the entire array of effects via the `all`
provider:

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
      all: () => ['Tucker', 11],
    })
    .put({
      type: 'USER',
      payload: { name: 'Tucker', age: 11 },
    })
    .run();
});
```

### Race

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

### Errors

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

### Providing in Forked/Spawned Sagas

Providers work for effects in forked/spawned sagas too.

```js
import { call, fork, put } from 'redux-saga/effects';
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

## Multiple Providers

You can supply multiple object providers via a couple methods. The easiest way
is to pass in an array of object providers to the `provide` method. Provider
functions will be composed according to the effect type, meaning the provider
functions in the first object will be called before subsequent provider
functions in the array.

Because provider functions are composed, they are similar to middleware. The
`next` function argument inside provider functions allows you to delegate to the
next provider in the middleware stack. If no more providers are available, then
`next` will delegate to Redux Saga to handle the effect as normal.

```js
import { call, put, select } from 'redux-saga/effects';
import api from 'my-api';
import * as selectors from 'my-selectors';

function* saga() {
  const user = yield call(api.findUser, 1);
  const dog = yield call(api.findDog);
  const greeting = yield call(api.findGreeting);
  const otherData = yield select(selectors.getOtherData);

  yield put({
    type: 'DONE',
    payload: { user, dog, greeting, otherData },
  });
}

const fakeUser = { name: 'John Doe' };
const fakeDog = { name: 'Tucker' };
const fakeOtherData = { foo: 'bar' };

const provideUser = ({ fn, args: [id] }, next) => (
  fn === api.findUser ? fakeUser : next()
);

const provideDog = ({ fn }, next) => (
  fn === api.findDog ? fakeDog : next()
);

const provideOtherData = ({ selector }, next) => (
  selector === selectors.getOtherData ? fakeOtherData : next()
);

it('takes multiple providers and composes them', () => {
  return expectSaga(saga)
    .provide([
      { call: provideUser, select: provideOtherData },
      { call: provideDog },
    ])
    .put({
      type: 'DONE',
      payload: {
        user: fakeUser,
        dog: fakeDog,
        greeting: 'hello',
        otherData: fakeOtherData,
      },
    })
    .run();
});
```

An alternative to supplying multiple provider objects is to only pass one object
into `provide` and use the `composeProviders` function to compose multiple
provider functions for a specific effect. You can import the `composeProviders`
function from the `redux-saga-test-plan/providers` module. The provider
functions are composed from left to right.

```js
import { composeProviders } from 'redux-saga-test-plan/providers';

it('takes multiple providers and composes them', () => {
  return expectSaga(saga)
    .provide({
      call: composeProviders(
        provideUser,
        provideDog
      ),

      select: provideOtherData,
    })
    .put({
      type: 'DONE',
      payload: {
        user: fakeUser,
        dog: fakeDog,
        greeting: 'hello',
        otherData: fakeOtherData,
      },
    })
    .run();
});
```

## More Examples

For some more contrived examples of providers, look in the
[repo tests](https://github.com/jfairbank/redux-saga-test-plan/tree/master/__tests__/expectSaga/providers).

## Caveats

For providers to work, `expectSaga` will necessarily wrap forked/spawned sagas
with an intermediary generator called `sagaWrapper` in order to intercept
effects. To ensure that your saga receives back a task object with a correct
`name` property, Redux Saga Test Plan will attempt to rename the `sagaWrapper`
function to the name of a forked saga. This works in almost all JavaScript
environments but will fail in PhantomJS. Therefore, you **can't** depend on the
task `name` property being correct in PhantomJS.
