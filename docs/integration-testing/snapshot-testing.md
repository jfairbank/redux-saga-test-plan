# Snapshot Testing

The `Promise` from `run` resolves with a `toJSON` method that serializes the
effects to a form appropriate for snapshot testing.

```js
function* saga(id) {
  const user = call(api.fetchUser, id);
  yield put({ type: 'DONE', payload: user });
}

it('can be used with snapshot testing', () => {
  return expectSaga(saga, 42)
    .run()
    .then((result) => {
      expect(result.toJSON()).toMatchSnapshot();
    });
});
```

The previous test would result in this snapshot. Notice that Redux Saga Test
Plan attempts to preserve functions yielded in `call` by serializing them to a
special string key. This depends on the function's having a name, but will
default to `<anonymous>` for the function name if it's missing.

```js
exports[`can be used with snapshot testing 1`] = `
Object {
  "put": Array [
    Object {
      "PUT": Object {
        "action": Object {
          "payload": Object {
            "CALL": Object {
              "args": Array [
                42,
              ],
              "context": null,
              "fn": "@@redux-saga-test-plan/json/function/fetchUser",
            },
          },
          "type": "DONE",
        },
        "channel": null,
      },
    },
  ],
}
`;
```
