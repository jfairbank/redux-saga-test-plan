# General Assertions

Other general assertions and helpers available are `is`, `parallel`, `isDone`,
`returns`, and `inspect`.

| Assertion  | Description                                                          |
| ---------- | -------------------------------------------------------------------- |
| `is`       | General purpose deep equal assertion                                 |
| `parallel` | Parallel effects assertion                                           |
| `isDone`   | Assert at end of saga                                                |
| `returns`  | Assert saga returns a value and is done                              |
| `inspect`  | Inspect the next yielded value for more fine-grained, custom testing |

#### Generic Example

```js
import { take } from 'redux-saga/effects';

function* mainSaga() {
  yield [
    take('HELLO'),
    take('WORLD'),
  ];

  yield 42;
  yield { foo: { bar: 'baz' } };
}

let saga = testSaga(mainSaga);

saga
  .next()
  .parallel([
    take('HELLO'),
    take('WORLD'),
  ])

  .next()
  .is(42)
  
  .next()
  .is({ foo: { bar: 'baz' } })
  
  .next()
  .isDone();
```

#### `returns` Example

```js
function* otherSaga(x) {
  return x * 2;
}

const saga = testSaga(otherSaga, 21);

saga
  .next()
  .returns(42);
```

#### `inspect` Example

If your saga yields a nondeterministic type of value or something not easily
covered by the effect assertions or other general assertions, then you can use
`inspect` to retrieve the actual yielded value and perform your own assertions
with your favorite assertion library.

```js
function* saga() {
  yield () => 42;
}

testSaga(saga)
  .next()
  .inspect((fn) => {
    expect(fn()).toBe(42);
  });
```
