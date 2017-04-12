# Partial Matching Assertions

Sometimes you're not interested in the exact arguments passed to a `call` effect
creator or the payload inside an action from a `put` effect. Instead you're only
concerned with _if_ a particular function was invoked via `call` or _if_ a
particular action type was dispatched via `put`. You can handle these situations
with partial matcher assertions.

The following assertions have a `like` method along with convenient helper
methods for partially matching assertions:

- `actionChannel`
- `apply`
- `call`
- `cps`
- `fork`
- `put`
- `put.resolve`
- `select`
- `spawn`

**NOTE:** the `like` method requires knowledge of the properties on effects such
as the `fn` property of `call` and the `action` property of `put`. Essentially,
`like` allows you to match effects with certain properties without worrying
about the other properties. Therefore, you can match a `call` by `fn` without
worrying about the `args` property.

## Example

Here is a simple example using `like`:

```js
function* userSaga(id) {
  try {
    const user = yield call(api.fetchUser, id);
    yield put({ type: 'RECEIVE_USER', payload: user });
  } catch (e) {
    yield put({ type: 'FAIL_USER', error: e });
  }
}

it('fetches user', () => {
  return expectSaga(userSaga)
    .call.like({ fn: api.fetchUser })
    .run();
});

it('fails', () => {
  return expectSaga(userSaga)
    .provide({
      call() {
        throw new Error('Not Found');
      },
    })
    .put.like({ action: { type: 'FAIL_USER' } })
    .run();
});
```

Notice that we can assert that the `api.fetchUser` function was called without
specifying the arguments. We can also assert in a failure scenario that an
action of type `FAIL_USER` was dispatched without worrying about the `error`
property of the action.

## Helper Methods Example

We can simplify the previous example with the convenient matcher helper methods
`call.fn` and `put.actionType`:

```js
function* userSaga(id) {
  try {
    const user = yield call(api.fetchUser, id);
    yield put({ type: 'RECEIVE_USER', payload: user });
  } catch (e) {
    yield put({ type: 'FAIL_USER', error: e });
  }
}

it('fetches user', () => {
  return expectSaga(userSaga)
    .call.fn(api.fetchUser)
    .run();
});

it('fails', () => {
  return expectSaga(userSaga)
    .provide({
      call() {
        throw new Error('Not Found');
      },
    })
    .put.actionType('FAIL_USER')
    .run();
});
```

## Multiple Properties

If you need it in rare cases, you can match on multiple shallow or deep
properties via `like`:

```js
function* saga(id) {
  yield put({
    type: 'FOO',
    payload: 42,
    meta: { hello: 'world' },
  });

  // This will be matched
  yield put({
    type: 'FOO',
    payload: 43,
    meta: { hello: 'world' },
  });
}

it('can match on multiple properties', () => {
  return expectSaga(saga)
    .put.like({
      action: {
        type: 'FOO',
        payload: 43,
      },
    })
    .run();
});
```

## Helper Methods

There are other some common helper methods like `fn` and `actionType` available,
appropriate to the kind of effect:

| Method | Description |
| ------ | ----------- |
| `actionChannel.pattern` | Match `actionChannel` by `pattern`. Useful if you use custom `buffers` with `actionChannel`. |
| `apply.fn` | Match `apply` by `fn`. |
| `call.fn` | Match `call` by `fn`. |
| `cps.fn` | Match `cps` by `fn`. |
| `fork.fn` | Match `fork` by `fn`. |
| `put.actionType` | Match `put` by `action.type`. |
| `put.resolve.actionType` | Match `put.resolve` by `action.type`. |
| `select.selector` | Match `select` by `selector` function. |
| `spawn.fn` | Match `spawn` by `fn`. |
