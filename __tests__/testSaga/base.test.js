// @flow
/* eslint-disable no-constant-condition */
import { call, fork, put, take } from 'redux-saga/effects';
import testSaga from 'testSaga';

const identity = value => value;

function* otherSaga(z) {
  yield put({ type: 'OTHER', payload: 'hi' });
  return z;
}

function* mainSaga(x, y, z) {
  try {
    const action = yield take('HELLO');
    yield put({ type: 'ADD', payload: x + y });
    yield call(identity, action);

    yield [
      call(identity, 'parallel call'),
      put({ type: 'PARALLEL_PUT' }),
    ];

    yield fork(otherSaga, z);
  } catch (e) {
    yield put({ type: 'ERROR', payload: e });
  }
}

function* loopingSaga() {
  while (true) {
    const action = yield take('HELLO');
    yield call(identity, action);
  }
}

const x = 40;
const y = 2;
const z = 20;

const action = { type: 'TEST' };

function createSaga() {
  return testSaga(mainSaga, x, y, z);
}

let saga;

beforeEach(() => {
  saga = createSaga();
});

test('follows the saga', () => {
  saga
    .next()
    .take('HELLO')

    .next(action)
    .put({ type: 'ADD', payload: x + y })

    .next()
    .call(identity, action)

    .next()
    .all([
      call(identity, 'parallel call'),
      put({ type: 'PARALLEL_PUT' }),
    ])

    .next()
    .fork(otherSaga, z)

    .next()
    .isDone();
});

test('can back up', () => {
  saga
    .next()
    .take('HELLO')

    .back()
    .next()
    .take('HELLO');
});

test('can back up multiple steps', () => {
  saga
    .next()
    .take('HELLO')

    .next()
    .put({ type: 'ADD', payload: x + y })

    .back(2)
    .next()
    .take('HELLO');
});

test('can back up to a named save point', () => {
  saga
    .next()
    .take('HELLO')

    .save('pre put(add)')

    .next(action)
    .put({ type: 'ADD', payload: x + y })

    .next()
    .call(identity, action)

    .restore('pre put(add)')

    .next(action)
    .put({ type: 'ADD', payload: x + y })

    .save('post put(add)')

    .back(1)

    .next(action)
    .put({ type: 'ADD', payload: x + y })

    .restart()
    .next()
    .take('HELLO')

    .restore('post put(add)')
    .next()
    .call(identity, action);
});

test('cannot back up to invalid save point', () => {
  expect(_ => {
    saga
      .next()
      .take('HELLO')

      .save('pre put(add)')

      .next(action)
      .put({ type: 'ADD', payload: x + y })

      .restore('foo bar baz');
  }).toThrow();
});

test('cannot back up at start', () => {
  expect(_ => {
    saga.back();
  }).toThrow();
});

test('cannot back up past beginning', () => {
  expect(_ => {
    saga
      .next()
      .take('HELLO')
      .back(2);
  }).toThrow();
});

test('can finish the generator early', () => {
  testSaga(loopingSaga)
    .next()

    .take('HELLO')
    .next(action)
    .call(identity, action)
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
});

test('can finish with an arg', () => {
  testSaga(loopingSaga)
    .next()

    .take('HELLO')
    .next(action)
    .call(identity, action)
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
});

test('throws for an incorrect take', () => {
  expect(_ => {
    saga.next().take('WORLD');
  }).toThrow();
});

test('throws for an incorrect put', () => {
  expect(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'ADD', payload: x + y + 1 });
  }).toThrow();

  expect(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'SUBTRACT', payload: x + y });
  }).toThrow();
});

test('throws for an incorrect call', () => {
  expect(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'ADD', payload: x + y })

      .next()
      .call(identity, y - 1);
  }).toThrow();

  expect(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'ADD', payload: x + y })

      .next()
      .call(__ => {}, y);
  }).toThrow();
});

test('throws for an incorrect fork', () => {
  expect(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'ADD', payload: x + y })

      .next()
      .call(identity, y)

      .next()
      .fork(otherSaga, z + 1);
  }).toThrow();

  expect(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'ADD', payload: x + y })

      .next()
      .call(identity, y)

      .next()
      .fork(__ => {}, z);
  }).toThrow();
});

test('throws for an incorrect sequence', () => {
  expect(_ => {
    saga.next().call(__ => {});
  }).toThrow();
});

test('follows catch block when throwing', () => {
  const error = new Error('My Error');

  saga
    .next()
    .throw(error)
    .put({ type: 'ERROR', payload: error })

    .next()
    .isDone();
});

test('restarts when done', () => {
  saga
    .next()
    .take('HELLO')

    .next(action)
    .put({ type: 'ADD', payload: x + y })

    .next()
    .call(identity, action)

    .next()
    .all([
      call(identity, 'parallel call'),
      put({ type: 'PARALLEL_PUT' }),
    ])

    .next()
    .fork(otherSaga, z)

    .next()
    .isDone()

    .restart()

    .next()
    .take('HELLO')

    .next(action)
    .put({ type: 'ADD', payload: x + y })

    .next()
    .call(identity, action)

    .next()
    .all([
      call(identity, 'parallel call'),
      put({ type: 'PARALLEL_PUT' }),
    ])

    .next()
    .fork(otherSaga, z)

    .next()
    .isDone();
});

test('restarts before done', () => {
  saga
    .next()
    .take('HELLO')

    .next(action)
    .put({ type: 'ADD', payload: x + y })

    .next()
    .call(identity, action)

    .restart()

    .next()
    .take('HELLO')

    .next(action)
    .put({ type: 'ADD', payload: x + y })

    .next()
    .call(identity, action)

    .next()
    .all([
      call(identity, 'parallel call'),
      put({ type: 'PARALLEL_PUT' }),
    ])

    .next()
    .fork(otherSaga, z)

    .next()
    .isDone();
});

test('restarts can change generator arguments', () => {
  const newX = 20;
  const newY = 1;
  const newZ = 10;

  saga
    .next()
    .take('HELLO')

    .next(action)
    .put({ type: 'ADD', payload: x + y })

    .next()
    .call(identity, action)

    .next()
    .all([
      call(identity, 'parallel call'),
      put({ type: 'PARALLEL_PUT' }),
    ])

    .next()
    .fork(otherSaga, z)

    .next()
    .isDone()

    .restart(newX, newY, newZ)

    .next()
    .take('HELLO')

    .next(action)
    .put({ type: 'ADD', payload: newX + newY })

    .next()
    .call(identity, action)

    .next()
    .all([
      call(identity, 'parallel call'),
      put({ type: 'PARALLEL_PUT' }),
    ])

    .next()
    .fork(otherSaga, newZ)

    .next()
    .isDone();
});

test('.isDone throws if not done', () => {
  expect(_ => {
    saga.next().isDone();
  }).toThrow();
});

test('.returns if not done', () => {
  expect(_ => {
    testSaga(otherSaga, 1)
      .next()
      .returns(1);
  }).toThrow();
});

test('.returns if return value was not as expected', () => {
  expect(_ => {
    testSaga(otherSaga, 1)
      .next()
      .put({ type: 'OTHER', payload: 'hi' })
      .next()
      .returns('foobar');
  }).toThrow();
});

test('.returns does not throw if finished and return value matches', () => {
  testSaga(otherSaga, 1)
    .next()
    .put({ type: 'OTHER', payload: 'hi' })
    .next()
    .returns(1);
});

test('applying all possible history types', () => {
  const getValue = () => 4;

  function* mySaga() {
    try {
      const value = yield call(getValue);
      yield value;
    } catch (e) {
      yield e.message;
      yield call(getValue);
    }
  }

  const error = new Error('an error');

  testSaga(mySaga)
    .next()
    .call(getValue)
    .next(42)
    .is(42)
    .back()
    .throw(error)
    .is(error.message)
    .next()
    .call(getValue)
    .finish()
    .next()
    .back()
    .finish(42)
    .next()
    .back();
});
