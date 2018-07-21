# Thrown Errors

You can assert that the saga throws a particular error using the `throws` method:

```js
function* saga() {
  throw new Error();
}

it('throws an error of type Error', () => {
  return expectSaga(saga)
    .throws(Error)
    .run();
});
```

It is also possible to match errors by [exact] value, which is useful for matching plain object errors:

```js
function* saga() {
  throw { message: 'Plain Object Error' };
}

it('throws a plain object error', () => {
  return expectSaga(saga)
    .throws({ message: 'Plain Object Error' })
    .run();
});
```

Other assertions are also checked when an error is thrown. This can be used to verify cleanup code etc:

```js
function* saga() {
  yield put({ type: 'API_STARTED' });

  try {
    yield call(callApi, '/users/', 'get');
  } catch (e) {
    yield put({ type: 'API_FAILED' });
    throw e;
  }

  yield put({ type: 'API_SUCCESS' });
}

it('cleans up on API error', () =>
  expectSaga(saga)
    .provide([
      [matchers.call.fn(callApi), throwError(apiError)],
    ])
    .put({ type: 'API_STARTED' })
    .call.fn(callApi)
    .put({ type: 'API_FAILED' })
    .throws(apiError)
    .run());
```


Negated assertions also work, however you must be wary that if the saga throws errors that don't match, the test will pass silently:
```js
function* saga() {
  throw new Error();
}

// This test will pass!
it('doesnt throw an error of type CustomErrorType', () => {
  return expectSaga(saga)
    .not.throws(CustomErrorType)
    .run();
});

// This test will fail
it('doesnt throw an error of type Error', () => {
  return expectSaga(saga)
    .not.throws(Error)
    .run();
});
```