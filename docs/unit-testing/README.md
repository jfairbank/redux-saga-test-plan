# Unit Testing

For unit testing, Redux Saga Test Plan exports a `testSaga` function that
creates a mock saga for you to assert effects on. `testSaga` is agnostic about
your testing framework, so it simply throws if the sequence of yielded effects
don't match your assertion effects.

Pass in your generator function as the first argument. Pass in additional
arguments which will be the arguments passed on to the generator function.

```js
// ES2015
import { testSaga } from 'redux-saga-test-plan';

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

Each `next` and `throw` call returns an API with effect assertions. All Redux
Saga effects are available such as `call`, `put`, `take`, `fork`, etc. An
additional effect called `isDone` allows you to assert that the generator as
reached the end.

```js
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

let saga = testSaga(mainSaga, 40, 2, 20);

// try path
saga.next().take('HELLO');
saga.next(action).put({ type: 'ADD', payload: 42 });
saga.next().call(identity, action);
saga.next().fork(otherSaga);
saga.next().isDone();

// Or chain together
saga = testSaga(mainSaga, 40, 2, 20);
saga
  .next()
  .take('HELLO')

  .next(action)
  .put({ type: 'ADD', payload: 42 })

  .next()
  .call(identity, action)

  .next()
  .fork(otherSaga)

  .next()
  .isDone();

// catch path
const error = new Error('My Error');
saga = testSaga(mainSaga, 40, 2, 20);
saga
  .next()

  .throw(error)
  .put({ type: 'ERROR', payload: error })

  .next()
  .isDone();
```
