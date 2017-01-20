# State

If your saga uses the `select` effect, then you'll need some state to select
against. The `expectSaga` API includes a `withState` method to set the store
state for your test.

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
