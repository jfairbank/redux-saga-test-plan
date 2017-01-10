# Dispatching Actions

Most sagas use the `take` effect to wait on Redux actions. Because `expectSaga`
runs your saga as normal, it will block on yielded `take` effects. To ensure
your saga can keep running, `expectSaga` also has a `dispatch` method. Before
running your saga, dispatch any actions you expect your saga to take in the
order it takes them. Internally, `expectSaga` will queue the actions and
dispatch them on your behalf as needed.

```js
import { put } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';

function* mainSaga(x, y) {
  yield take('HELLO');
  yield put({ type: 'ADD', payload: x + y });
  yield take('WORLD');
  yield put({ type: 'DONE' });
}

expectSaga(mainSaga, 40, 2)
  // note that assertions don't have to be in order
  .put({ type: 'DONE' })
  .put({ type: 'ADD', payload: 42 })

  // dispatch any actions your saga will `take`
  // dispatched actions MUST be in order
  .dispatch({ type: 'HELLO' })
  .dispatch({ type: 'WORLD' })

  .run();
```
