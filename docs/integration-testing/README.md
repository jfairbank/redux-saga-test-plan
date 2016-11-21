# Integration Testing

One downside to unit testing is that it couples your test to your
implementation. Simple reordering of yielded effects in your saga could break
your tests even if the functionality stays the same. If you're not concerned
with the order or exact effects your saga yields, then you can take a
integration testing approach, whereby your saga is actually run by Redux Saga.
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

  // start Redux Saga up with the saga
  .start()

  // dispatch any actions your saga will `take`
  .dispatch({ type: 'HELLO' })

  // stop the saga
  .stop();
```
