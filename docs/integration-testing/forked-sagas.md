# Forked Sagas

`expectSaga` assertions not only work for your main saga, but also for forked
sagas. Here is a minimal example where we can assert from a behavior perspective
that the saga(s) `put` the `FORKED` action regardless of which saga actually
puts it.

```js
function* otherSaga() {
  yield put({ type: 'FORKED' });
}

function* saga() {
  yield fork(otherSaga);
}

function* sagaWithTakeEvery() {
  yield takeEvery('TAKE_EVERY', otherSaga);
}

it('forked saga runs', () => {
  return expectSaga(saga)
    // This action comes from the forked `otherSaga`!
    .put({ type: 'FORKED' })
    .run();
});

it('takeEvery saga runs', () => {
  return expectSaga(sagaWithTakeEvery)
    // This action comes from the forked `otherSaga`!
    .put({ type: 'FORKED' })
    .dispatch({ type: 'TAKE_EVERY' })
    .run();
});

it('fork assertion passes', () => {
  return expectSaga(saga)
    // There are other assertions besides `put`
    // if you want to use them.
    .fork(otherSaga)
    .run();
});
```
