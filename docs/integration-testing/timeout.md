# Timeout

Because `expectSaga` runs sagas asynchronously, it has a default timeout in case
your saga runs too long. This is needed for sagas that have multiple
asynchronous actions, that have infinite loops, or that use saga helpers like
`takeEvery`. `expectSaga` will cancel your saga if it times out and print a
warning message.

```js
function* mainSaga() {
  while (true) {
    const action = yield take('READY');
    yield put({ type: 'DATA', payload: action.payload });
  }
}

it('times out', () => {
  return expectSaga(mainSaga)
    .put({ type: 'DATA', payload: 42 })
    .dispatch({ type: 'READY', payload: 42 })

    // saga never terminates on its own
    // implicit timeout of 250ms will cancel saga
    // and print warning message to console
    .run();
});
```

### Silencing Warnings

The warning message is typically useful if a saga without an infinite loop is
taking too long. If you have a saga with an infinite loop, though, you will want
it to time out. Therefore, to silence the warning message, you can pass into the
`run` method an object with the `silenceTimeout` property set to `true`.

```js
it('can be silenced', () => {
  return expectSaga(mainSaga)
    .put({ type: 'DATA', payload: 42 })
    .dispatch({ type: 'READY', payload: 42 })

    // no warning message will be printed
    // this is useful if you expect the saga to time out
    .run({ silenceTimeout: true });
});
```

For convenience, you may also use the `silentRun` method which functions the same but is easier to type and read.

### Adjusting Timeout

Instead of silencing warnings, you can adjust the timeout length. The default
timeout length is 250 milliseconds. You can change the default timeout by
setting the `DEFAULT_TIMEOUT` property of `expectSaga` in milliseconds.

```js
expectSaga.DEFAULT_TIMEOUT = 500; // set it to 500ms
```

If you want to override the timeout for a particular test case, then you can
pass in a timeout length to the `run` (or `silentRun`) method.

```js
const delay = time => new Promise(resolve => setTimeout(resolve, time));

function* mainSaga() {
  yield call(delay, 300);
  yield put({ type: 'HELLO' });
}

it('can have a different timeout length', () => {
  return expectSaga(mainSaga)
    .put({ type: 'HELLO' })

    // saga will take at least 300ms,
    // so time out after 500ms to be safe
    .run(500);
});
```

Alternatively, you can opt out of the timeout behavior and force `expectSaga` to
wait until your saga is done on its own by passing in `false` to the `run`
method. **WARNING:** this won't work with sagas with infinite loops because the
saga will never finish on its own.

```js
it('never times out', () => {
  return expectSaga(mainSaga)
    .put({ type: 'HELLO' })

    // wait until the saga finishes on its own
    .run(false);
});
```
