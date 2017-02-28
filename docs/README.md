# Redux Saga Test Plan

[![npm](https://img.shields.io/npm/v/redux-saga-test-plan.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga-test-plan)
[![Travis branch](https://img.shields.io/travis/jfairbank/redux-saga-test-plan/master.svg?style=flat-square)](https://travis-ci.org/jfairbank/redux-saga-test-plan)
[![Codecov](https://img.shields.io/codecov/c/github/jfairbank/redux-saga-test-plan.svg?style=flat-square)](https://codecov.io/gh/jfairbank/redux-saga-test-plan)

#### Powerful test helpers for Redux Saga.

Redux Saga Test Plan makes testing sagas a breeze. Whether you need to test
exact effects and their ordering or just test your saga `put`'s a specific
action at some point, Redux Saga Test Plan has you covered.

Redux Saga Test Plan aims to embrace both unit testing and integration testing
approaches to make testing your sagas easy.

## Integration Testing

**Requires global `Promise` to be available**

One downside to unit testing sagas is that it couples your test to your
implementation. Simple reordering of yielded effects in your saga could break
your tests even if the functionality stays the same. If you're not concerned
with the order or exact effects your saga yields, then you can take a
integrative approach, testing the behavior of your saga when run by Redux Saga.
Then, you can simply test that a particular effect was yielded during the saga
run. For this, use the `expectSaga` test function.

### Simple Example

```js
import { expectSaga } from 'redux-saga-test-plan';

function identity(value) {
  return value;
}

function* mainSaga(x, y) {
  const action = yield take('HELLO');

  yield put({ type: 'ADD', payload: x + y });
  yield call(identity, action);
}

it('just works!', () => {
  return expectSaga(mainSaga, 40, 2)
    // assert that the saga will eventually yield `put`
    // with the expected action
    .put({ type: 'ADD', payload: 42 })

    // dispatch any actions your saga will `take`
    .dispatch({ type: 'HELLO' })

    // run it
    .run();
});
```

### Example with Reducer

```js
import { expectSaga } from 'redux-saga-test-plan';

const HAVE_BIRTHDAY = 'HAVE_BIRTHDAY';
const AGE_BEFORE = 'AGE_BEFORE';
const AGE_AFTER = 'AGE_AFTER';

const initialDog = {
  name: 'Tucker',
  age: 11,
};

function dogReducer(state = initialDog, action) {
  if (action.type === HAVE_BIRTHDAY) {
    return {
      ...state,
      age: state.age + 1,
    };
  }

  return state;
}

function getAge(state) {
  return state.age;
}

function* saga() {
  const ageBefore = yield select(getAge);

  yield put({ type: AGE_BEFORE, payload: ageBefore });

  yield take(HAVE_BIRTHDAY);

  const ageAfter = yield select(getAge);

  yield put({ type: AGE_AFTER, payload: ageAfter });
}

it('handles reducers', () => {
  return expectSaga(saga)
    .withReducer(dogReducer)

    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 12 })

    .dispatch({ type: HAVE_BIRTHDAY })

    .run();
});
```

Yes, it's that simple to test with `expectSaga`.

## Unit Testing

If you want to ensure that your saga yields specific types of effects in a
particular order, then you'll want to use the `testSaga` function. Here's a
simple example:

```js
import { testSaga } from 'redux-saga-test-plan';

function identity(value) {
  return value;
}

function* mainSaga(x, y) {
  const action = yield take('HELLO');

  yield put({ type: 'ADD', payload: x + y });
  yield call(identity, action);
}

const action = { type: 'TEST' };

it('works with unit tests', () => {
  testSaga(mainSaga, 40, 2);
    // advance saga with `next()`
    .next()

    // assert that the saga yields `take` with `'HELLO'` as type
    .take('HELLO')

    // pass back in a value to a saga after it yields
    .next(action)

    // assert that the saga yields `put` with the expected action
    .put({ type: 'ADD', payload: 42 })

    .next()

    // assert that the saga yields a `call` to `identity` with
    // the `action` argument
    .call(identity, action)

    .next()

    // assert that the saga is finished
    .isDone();
});
```

## Table of Contents

- [Introduction](/README.md)
- [Getting Started](/getting-started.md)
- [Integration Testing](/integration-testing/README.md)
  - [Effect Creators](/integration-testing/effect-creators.md)
  - [Dispatching](/integration-testing/dispatching.md)
  - [Timeout](/integration-testing/timeout.md)
  - [State](/integration-testing/state.md)
  - [Forked Sagas](/integration-testing/forked-sagas.md)
- [Unit Testing](/unit-testing/README.md)
  - [Error Messages](/unit-testing/error-messages.md)
  - [Effect Creators](/unit-testing/effect-creators.md)
  - [Saga Helpers](/unit-testing/saga-helpers.md)
  - [General Assertions](/unit-testing/general-assertions.md)
  - [Time Travel](/unit-testing/time-travel.md)
