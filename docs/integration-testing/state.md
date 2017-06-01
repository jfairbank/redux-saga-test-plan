# State

You can test your saga's integration with your reducer and store state via the
`withState`, `withReducer`, and `hasFinalState` methods.

## Static State via `withState`

For static state, you can just use the `withState` method to allow `select`
effects to work. You can also use
[providers](/integration-testing/mocking/README.md) for this.

```js
const storeState = {
  data: {
    foo: 'bar',
  },
};

function getData(state) {
  return state.data;
}

function* saga() {
  const data = yield select(getData);
  yield put({ type: 'DATA', payload: data });
}

it('can take store state', () => {
  return expectSaga(saga)
    .withState(storeState)
    .put({ type: 'DATA', payload: storeState.data })
    .run();
});
```

## Dynamic State via `withReducer`

For state that might change, you can use the `withReducer` method. It takes two
arguments: your reducer and optional initial state. If you don't supply the
initial state, then `withReducer` will extract it by passing an initial action
into your reducer like Redux.

Any `select` effects will reflect state changes where appropriate. More
importantly, you can test your store state after the saga completes via
`hasFinalState`.

```js
const initialDog = {
  name: 'Tucker',
  age: 11,
};

function dogReducer(state = initialDog, action) {
  if (action.type === 'HAVE_BIRTHDAY') {
    return {
      ...state,
      age: state.age + 1,
    };
  }

  return state;
}

function* saga() {
  yield put({ type: 'HAVE_BIRTHDAY' });
}

it('handles reducers when not supplying initial state', () => {
  return expectSaga(saga)
    .withReducer(dogReducer)
    .hasFinalState({
      name: 'Tucker',
      age: 12, // <-- age in store state changed
    })
    .run();
});

it('handles reducers when supplying initial state', () => {
  return expectSaga(saga)
    .withReducer(dogReducer, initialDog)
    .hasFinalState({
      name: 'Tucker',
      age: 12, // <-- age in store state changed
    })
    .run();
});
```

## Exposed Store State

The `Promise` returned from `run` resolves with a `storeState` object that you
can inspect for more fine-grained testing.

```js
it('exposes the store state', () => {
  return expectSaga(saga)
    .withReducer(dogReducer, initialDog)
    .run()
    .then((result) => {
      expect(result.storeState).toEqual({
        name: 'Tucker',
        age: 12, // <-- age in store state changed
      });
    });
});

it('exposes the store state using async/await', async () => {
  const { storeState } = await expectSaga(saga)
    .withReducer(dogReducer, initialDog)
    .run();

  expect(storeState).toEqual({
    name: 'Tucker',
    age: 12, // <-- age in store state changed
  });
});
```
