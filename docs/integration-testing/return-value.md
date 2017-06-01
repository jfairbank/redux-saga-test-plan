# Return Value

You can assert the return value of a saga via the `returns` method. This only
works for the top-level saga under test, meaning other sagas that are invoked
via `call`, `fork`, or `spawn` won't report their return value.

```js
function* saga() {
  const data = yield call(someApi);
  return data;
}

it('returns a greeting', () => {
  return expectSaga(saga)
    .provide([
      [call(someApi), { hello: 'world' }],
    ])
    .returns({ hello: 'world' })
    .run();
});
```

The `Promise` returned from `run` also resolves with the top-level saga's return
value.

```js
it('exposes the return value', () => {
  return expectSaga(saga)
    .provide([
      [call(someApi), { hello: 'world' }],
    ])
    .run()
    .then((result) => {
      expect(result.returnValue).toEqual({ hello: 'world' });
    });
});

it('exposes the return value using async/await', async () => {
  const { returnValue } = await expectSaga(saga)
    .provide([
      [call(someApi), { hello: 'world' }],
    ])
    .run();

  expect(returnValue).toEqual({ hello: 'world' });
});
```
