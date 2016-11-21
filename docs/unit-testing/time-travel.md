# Time Travel

The mock saga can also time travel through the saga generator.

| Method                         | Description                                            |
| ------------------------------ | ------------------------------------------------------ |
| `back(n?: number)`             | Back up a number of steps in the saga (defaults to 1)  |
| `restart(...args: Array<any>)` | Restart the saga from the beginning                    |
| `finish(arg?: any)`            | Finish a saga early by forcing a return                |
| `save(label: string)`          | Save a point in history with a label                   |
| `restore(label: string)`       | Restore a point in history (label must be saved prior) |

### Go Back or Restart

For simple time travel, the mock saga includes `back` and `restart` methods
which allow you to back up some number of steps or completely restart the saga.
This is useful for handling multiple control flow branches such as `if/else` and
`try/catch`.

`back` takes an optional number argument to specify the number of steps to back
up. It defaults to 1.

As its name suggestions, `restart` will restart your saga. If your saga takes
arguments, then you can restart with new arguments by passing them in to
`restart`. If you don't supply any arguments, then it will restart with whatever
original arguments you used.

```js
function getPredicate() {}

function* mainSaga(x) {
  try {
    const predicate = yield select(getPredicate);

    if (predicate) {
      yield take('TRUE');
    } else {
      yield take('FALSE');
    }

    yield put({ type: 'DONE', payload: x });
  } catch (e) {
    yield take('ERROR');
  }
}

let saga = testSaga(mainSaga, 42);

// Back up one step by default
saga
  .next()
  .select(getPredicate)

  .back()
  .next()
  .select(getPredicate);

// Back up `2` steps to try `else` branch
saga = testSaga(mainSaga, 42);
saga
  .next()
  .select(getPredicate)

  .next(true)
  .take('TRUE')

  .next()
  .isDone()

  .back(2)
  .next(false)
  .take('FALSE')

  .next()
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone();

// Restart from the beginning to throw
const error = new Error('My Error');
saga = testSaga(mainSaga, 42);

saga
  .next()
  .select(getPredicate)

  .next(true)
  .take('TRUE')

  .next()
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone()

  .restart()
  .next()
  .throw(error)
  .take('ERROR')

  .next()
  .isDone();

// Restart to update the argument
saga = testSaga(mainSaga, 42);

saga
  .next()
  .select(getPredicate)

  .next(true)
  .take('TRUE')

  .next()
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone()

  .restart('hello world')
  .next()
  .select(getPredicate)

  .next(true)
  .take('TRUE')

  .next()
  .put({ type: 'DONE', payload: 'hello world' })

  .next()
  .isDone();
```

### Finish Early

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

let saga = testSaga(loopingSaga);

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

// With argument(s)

saga = testSaga(loopingSaga);

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

  .finish(42)
  .returns(42);
```

### Save and Restore History

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

As the names suggest `save` and `restore` allow you to restore saved history.
This can sometimes be beneficial for fast forwarding through a saga.

```js
saga
  .next()
  .take('READY')

  .next()
  .select(getPredicate)

  .save('before predicate') // <--
  .next(true)
  .take('TRUE')

  .next()
  .select(getFinalPayload)

  .save('predicate=true, before supply final payload') // <--
  .next(42)
  .put({ type: 'DONE', payload: 42 })

  .next()
  .isDone()

  .restart()
  .restore('before predicate') // <--
  .next(false)
  .take('FALSE')

  .restore('predicate=true, before supply final payload') // <--
  .next(102)
  .put({ type: 'DONE', payload: 1 })

  .next()
  .isDone();
```

### NOTE

Despite what the previous example suggests, `save` and `restore` don't
necessarily allow you to jump forward in your saga. As mentioned, they
**restore** history. This means the saga will be restarted, and the history for
the named label will be applied to get you back to a certain point in the saga.
For some cases, you can use this to jump forward, but in other cases, you might
expect the internal state of your saga to be different from what the applied
history had. Here's an example to show what wouldn't work with `save` and
`restore`.

```js
function getPredicate() {}
function itWasTrue() {}
function itWasFalse() {}

export default function* mainSaga() {
  try {
    yield take('READY');

    const predicate = yield select(getPredicate);

    if (predicate) {
      yield take('TRUE');
      yield call(itWasTrue);
    } else {
      yield take('FALSE');
      yield call(itWasFalse);
    }

    yield put({ type: 'DONE', payload: predicate });
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

  .save('before predicate') // <--
  .next(true)
  .take('TRUE')

  .next()
  .call(itWasTrue)

  .save('before final put') // <--
  .next()
  .put({ type: 'DONE', payload: true })

  .next()
  .isDone()

  .restore('before predicate') // <-- restore and update predicate value
  .next(false)
  .take('FALSE')

  .restore('before final put') // <--
  .next()
  .put({ type: 'DONE', payload: false }) // <-- this will be wrong

  .next()
  .isDone();

// SagaTestError:
// Assertion 5 failed: put effects do not match
//
// Expected
// --------
// { channel: null, action: { type: 'DONE', payload: false } }
//
// Actual
// ------
// { channel: null, action: { type: 'DONE', payload: true } }
```

Even though we restore the `'before predicate'` label and supply a new value to
the `predicate` variable, that will get overwritten to whatever the history for
`predicate` was when we saved the `'before final put'` label. True time travel
is not available yet but is a tentatively planned feature in the future. Ideas
and contributions are welcome to add true time travel.
