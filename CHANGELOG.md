## v1.0.0

### :tada: First major release - no breaking changes

With the recent additions courtesy of [@rixth](https://github.com/rixth), the
API feels solid enough to bump to v1.0.0.

### NEW - Finish early (credit [@rixth](https://github.com/rixth))

If you want to finish a saga early like bailing out of a `while` loop, then you
can use the `finish` method.

```js
function identity(value) {
  return value;
}

function* loopingSaga() {
  while (true) {
    const action = yield take('HELLO');
    yield call(identity, action);
  }
}

const saga = testSaga(loopingSaga);

saga
  .next()

  .take('HELLO')
  .next(action)
  .call(identity, action)
  .next()

  .take('HELLO')
  .next(action)
  .call(identity, action)
  .next()

  .finish()
  .next()
  .isDone();
```

### NEW - Assert returned values (credit [@rixth](https://github.com/rixth))

Assert a value is returned from a saga and that it is finished with the
`returns` method.

```js
function* doubleSaga(x) {
  return x * 2;
}

const saga = testSaga(doubleSaga, 21);

saga
  .next()
  .returns(42);
```

### NEW - Save and restore history (credit [@rixth](https://github.com/rixth))

For more robust time travel, you can use the `save` and `restore` methods. The
`save` method allows you to label a point in the saga that you can return to by
calling `restore` with the same label. This can be more useful and less brittle
than using the simple `back` method.

```js
function getPredicate() {}
function getFinalPayload() {}

export default function* mainSaga() {
  try {
    yield take('READY');

    const predicate = yield select(getPredicate);

    if (predicate) {
      yield take('TRUE');
    } else {
      yield take('FALSE');
    }

    let payload = yield select(getFinalPayload);

    payload %= 101;

    yield put({ payload, type: 'DONE' });
  } catch (e) {
    yield take('ERROR');
  }
}

const saga = testSaga(mainSaga);

saga
  .next()
  .take('READY')

  .next()
  .select(getPredicate)

  .save('before predicate') // <-- save the point before if/else
  .next(true)
  .take('TRUE')

  .next()
  .select(getFinalPayload)

  .next(42)
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone()

  .restore('before predicate') // <-- restore history before if/else
  .next(false)
  .take('FALSE')

  .next()
  .select(getFinalPayload)

  .next(42)
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone();
```

---

## v0.2.0

### More helpful error messaging

redux-saga-test-plan will now print out actual and expected effects when
assertions fail, so you have a better idea why a test is failing.

---

## v0.1.0

### Support redux-saga 0.11.x
