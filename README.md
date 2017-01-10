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

## Unit Testing

If you want to ensure that your saga yields specific types of effects in a
particular order, then you'll want to use the `testSaga` function. Here's a
simple example

```js
// ES2015
import { testSaga } from 'redux-saga-test-plan';

// ES5/CJS
var testSaga = require('redux-saga-test-plan').testSaga;

function identity(value) {
  return value;
}

function* mainSaga(x, y) {
  const action = yield take('HELLO');

  yield put({ type: 'ADD', payload: x + y });
  yield call(identity, action);
}

const action = { type: 'TEST' };

// create saga mock             x   y
const saga = testSaga(mainSaga, 40, 2);

saga
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
```

## Integration Testing

**NOTE: `exportSaga` is a relatively new feature of Redux Saga Test Plan, and
many kinks may still need worked out and other use cases considered.**

**Requires global `Promise` to be available**

One downside to unit testing is that it couples your test to your
implementation. Simple reordering of yielded effects in your saga could break
your tests even if the functionality stays the same. If you're not concerned
with the order or exact effects your saga yields, then you can take a
integrative approach, testing the behavior of your saga when run by Redux Saga.
Then, you can simply test that a particular effect was yielded during the saga
run. For this, use the `expectSaga` test function.

```js
// ES2015
import { expectSaga } from 'redux-saga-test-plan';

// ES5/CJS
var expectSaga = require('redux-saga-test-plan').expectSaga;

function identity(value) {
  return value;
}

function* mainSaga(x, y) {
  const action = yield take('HELLO');

  yield put({ type: 'ADD', payload: x + y });
  yield call(identity, action);
}

// create saga mock               x   y
const saga = expectSaga(mainSaga, 40, 2);

saga
  // assert that the saga will eventually yield `put`
  // with the expected action
  .put({ type: 'ADD', payload: 42 })

  // dispatch any actions your saga will `take`
  .dispatch({ type: 'HELLO' })

  // run it
  .run();
```

Yes, it's that simple to test with `expectSaga`.

## Install

Install with yarn or npm.

```
yarn add redux-saga-test-plan --dev
```

```
npm install --save-dev redux-saga-test-plan
```

## Getting Started

#### [Docs](http://redux-saga-test-plan.jeremyfairbank.com)

Redux Saga Test Plan has a host of options along with more helper methods for
testing sagas. To learn more, check out the docs at
[redux-saga-test-plan.jeremyfairbank.com](http://redux-saga-test-plan.jeremyfairbank.com).
