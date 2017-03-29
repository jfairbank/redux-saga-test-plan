# Negated Assertions

You can negate assertions too. Use the `not` property before calling an
`assertion`. Negated assertions also work with partial matcher assertions!

```js
function* authSaga() {
  const token = yield select(authToken);

  if (token) {
    yield call(api.setToken, token);
  }
}

it('does not set the token', () => {
  return expectSaga(authSaga)
    .withState({})
    .not.call.fn(api.setToken)
    .run();
});
```
