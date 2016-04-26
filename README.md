# Redux Saga Test Plan

Test helpers for redux-saga.

# Install

    $ npm install --save-dev redux-saga-test-plan

# Usage

Redux Saga Test Plan exports a `testSaga` function that creates a mock saga for
you to assert effects on. `testSaga` is agnostic about your testing framework,
so it simply throws if the sequence of yielded effects don't match your
assertion effects.

You pass in your generator function as the first argument. You can pass in
additional arguments which be the arguments passed on to the generator function.

```js
// ES2015
import testSaga from 'redux-saga-test-plan';

// ES5
var testSaga = require('redux-saga-test-plan').testSaga;

function identity(value) {
  return value;
}

function* otherSaga() {}

function* mainSaga(x, y, z) {
  try {
    const action = yield take('HELLO');
    yield put({ type: 'ADD', payload: x + y });
    yield call(identity, action);
    yield fork(otherSaga, z);
  } catch (e) {
    yield put({ type: 'ERROR', payload: e });
  }
}

const action = { type: 'TEST' };

// saga mock                    x   y  z
const saga = testSaga(mainSaga, 40, 2, 20);
```

The saga mock has `next` and `throw` iterator methods, so you can advance
through the saga. Pass in arguments to `next` to simulate response values from
`yields`. Similarly pass in arguments to `throw` to specify the thrown error.

Each `next` and `throw` call returns an API with effect
assertions. All Redux Saga effects are available such as `call`, `put`, `take`,
`fork`, etc. An additional effect called `isDone` allows you to assert that the
generator as reached the end.

```js
function* mainSaga(x, y, z) {
  try {
    const action = yield take('HELLO');
    yield put({ type: 'ADD', payload: x + y });
    yield call(identity, action);
    yield fork(otherSaga, z);
  } catch (e) {
    yield put({ type: 'ERROR', payload: e });
  }
}

const action = { type: 'TEST' };

let saga = testSaga(mainSaga, 40, 2, 20);

// Error free path
saga.next().take('HELLO');
saga.next(action).put({ type: 'ADD', payload: 42 });
saga.next().call(identity, action);
saga.next().fork(otherSaga);
saga.next().isDone();

// Or chain together
saga = testSaga(mainSaga, 40, 2, 20);
saga
  .next().take('HELLO')
  .next(action).put({ type: 'ADD', payload: 42 })
  .next().call(identity, action)
  .next().fork(otherSaga)
  .next().isDone();

// Error path
const error = new Error('My Error');
saga = testSaga(mainSaga, 40, 2, 20);
saga
  .next()
  .throw(error).put({ type: 'ERROR', payload: error })
  .next().isDone();
```

As mentioned if what's really yielded and what's asserted don't match, then the
mock saga will throw an error.

```js
const saga = testSaga(mainSaga, 40, 2, 20);

saga
  .next().take('HI'); // throws
```

The mock saga also includes `back` and `restart` methods which allow you to back
up some number of steps or completely restart the saga. This is useful for
handling multiple control flow branches such as `if/else` and `try/catch`.

```js
function getPredicate() {}

function* mainSaga() {
  try {
    const predicate = yield select(getPredicate);

    if (predicate) {
      yield take('TRUE');
    } else {
      yield take('FALSE');
    }
  } catch (e) {
    yield take('ERROR');
  }
}

let saga = testSaga(mainSaga);

// Back up one step by default
saga
  .next().select(getPredicate)
  .back()
  .next().select(getPredicate);

// Back up `2` steps to try `else` branch
saga = testSaga(mainSaga);
saga
  .next().select(getPredicate)
  .next(true).take('TRUE')
  .next().isDone()

  .back(2)
  .next(false).take('FALSE')
  .next().isDone();

// Restart from the beginning to throw
const error = new Error('My Error');
saga = testSaga(mainSaga);

saga
  .next().select(getPredicate)
  .next(true).take('TRUE')
  .next().isDone()

  .restart()
  .next()
  .throw(error).take('ERROR')
  .next().isDone();
```

Two final effect helpers are `is` and `parallel`. Use `is` as a general purpose
deep equal type assertion and `parallel` for parallel effects.

```js
import { take } from 'redux-saga/effects';

function* mainSaga() {
  yield [
    take('HELLO'),
    take('WORLD'),
  ];

  yield 42;
  yield { foo: { bar: 'baz' } };
}

const saga = testSaga(mainSaga);

saga
  .next().parallel([
    take('HELLO'),
    take('WORLD'),
  ])

  .next().is(42)
  .next().is({ foo: { bar: 'baz' } })
  .next().isDone();
```
