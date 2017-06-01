# Exposed Effects

The `Promise` returned by the `run` method resolves with an object that contains
any effects yielded by your saga and sagas that it forked. You can use this for
finer-grained control over testing exact number of effects. Be careful when
testing top-level sagas that fork other sagas because the effects object will
include yielded effects from all forked sagas too. There currently is no way to
distinguish between effects yielded by the top-level saga and forked sagas.

```js
function* userSaga(id) {
  const user = yield call(fetchUser, id);
  const pet = yield call(fetchPet, user.petId);

  yield put({ type: 'DONE', payload: { user, pet } });
}

it('exposes effects', () => {
  const id = 42;
  const petId = 20;

  const user = { id, petId, name: 'Jeremy' };
  const pet = { name: 'Tucker' };

  return expectSaga(saga, id)
    .provide([
      [call(fetchUser, id), user],
      [call(fetchPet, petId), pet],
    ])
    .run()
    .then((result) => {
      const { effects } = result;

      expect(effects.call).toHaveLength(2);
      expect(effects.put).toHaveLength(1);

      expect(effects.call[0]).toEqual(call(fetchUser, id));
      expect(effects.call[1]).toEqual(call(fetchPet, petId));

      expect(effects.put[0]).toEqual(
        put({ type: 'DONE', payload: { user, pet } })
      );
    });
});
```

Of course, `async` functions work nicely with this feature too.

```js
it('exposes effects using async functions', async () => {
  const id = 42;
  const petId = 20;

  const user = { id, petId, name: 'Jeremy' };
  const pet = { name: 'Tucker' };

  const { effects } = await expectSaga(saga, id)
    .provide([
      [call(fetchUser, id), user],
      [call(fetchPet, petId), pet],
    ])
    .run();

  expect(effects.call).toHaveLength(2);
  expect(effects.put).toHaveLength(1);

  expect(effects.call[0]).toEqual(call(fetchUser, id));
  expect(effects.call[1]).toEqual(call(fetchPet, petId));

  expect(effects.put[0]).toEqual(
    put({ type: 'DONE', payload: { user, pet } })
  );
});
```

## Inspect Specific Properties

If you want to inspect specific properties on an effect, you can use the
`asEffect` util from Redux Saga.

```js
import { asEffect } from 'redux-saga/utils';

it('can test properties on effects', () => {
  const id = 42;
  const petId = 20;

  const user = { id, petId, name: 'Jeremy' };
  const pet = { name: 'Tucker' };

  return expectSaga(saga, id)
    .provide([
      [call(fetchUser, id), user],
      [call(fetchPet, petId), pet],
    ])
    .run()
    .then((result) => {
      const { effects } = result;

      const fetchUserCall = asEffect.call(effects.call[0]);

      expect(fetchUserCall.fn).toBe(fetchUser);
      expect(fetchUserCall.args).toEqual([42]);
    });
});
```

## Available Effects

The available effects are:

- `actionChannel`
- `call`
- `cps`
- `fork`
- `join`
- `put`
- `race`
- `select`
- `take`
