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

it('handles dispatching actions', () => {
  return expectSaga(mainSaga, 40, 2)
    // note that assertions don't have to be in order
    .put({ type: 'DONE' })
    .put({ type: 'ADD', payload: 42 })

    // dispatch any actions your saga will `take`
    // dispatched actions MUST be in order
    .dispatch({ type: 'HELLO' })
    .dispatch({ type: 'WORLD' })

    .run();
});
```

## Dispatch actions while saga is running

You can also dispatch actions while a saga is running. This is useful for
delaying actions so Redux Saga Test Plan doesn't dispatch them too quickly.

```js
function* mainSaga() {
  // Received almost immediately
  yield take('FOO');

  // Received after 250ms
  yield take('BAR');
  yield put({ type: 'DONE' });
}

const delay = time => new Promise((resolve) => {
  setTimeout(resolve, time);
});

it('can dispatch actions while running', () => {
  const saga = expectSaga(mainSaga);

  saga.put({ type: 'DONE' });

  saga.dispatch({ type: 'FOO' });

  const promise = saga.run({ timeout: false });

  return delay(250).then(() => {
    saga.dispatch({ type: 'BAR' });
    return promise;
  });
});
```

## Delaying dispatching actions with `.delay()`

While being able to dispatch actions while the saga is running has use cases
besides only delaying, if you just want to delay dispatched actions, you can use
the `delay` method. It takes a delay time as its only argument.

```js
function* mainSaga() {
  // Received almost immediately
  yield take('FOO');

  // Received after 250ms
  yield take('BAR');
  yield put({ type: 'DONE' });
}

it('can delay actions', () => {
  return expectSaga(mainSaga)
    .put({ type: 'DONE' })
    .dispatch({ type: 'FOO' })
    .delay(250)
    .dispatch({ type: 'BAR' })
    .run({ timeout: false });
});
```
