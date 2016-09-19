/* @flow */
/* eslint-disable no-constant-condition */
import test from 'ava';
import { call, fork, put, take } from 'redux-saga/effects';
import { testSaga } from '../src';

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

test.beforeEach(_ => {
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
    .parallel([
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

test('cannot back up to invalid save point', t => {
  t.throws(_ => {
    saga
      .next()
      .take('HELLO')

      .save('pre put(add)')

      .next(action)
      .put({ type: 'ADD', payload: x + y })

      .restore('foo bar baz');
  });
});

test('cannot back up at start', t => {
  t.throws(_ => {
    saga.back();
  });
});

test('cannot back up past beginning', t => {
  t.throws(_ => {
    saga
      .next()
      .take('HELLO')
      .back(2);
  });
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

test('throws for an incorrect take', t => {
  t.throws(_ => {
    saga.next().take('WORLD');
  });
});

test('throws for an incorrect put', t => {
  t.throws(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'ADD', payload: x + y + 1 });
  });

  t.throws(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'SUBTRACT', payload: x + y });
  });
});

test('throws for an incorrect call', t => {
  t.throws(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'ADD', payload: x + y })

      .next()
      .call(identity, y - 1);
  });

  t.throws(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'ADD', payload: x + y })

      .next()
      .call(__ => {}, y);
  });
});

test('throws for an incorrect fork', t => {
  t.throws(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'ADD', payload: x + y })

      .next()
      .call(identity, y)

      .next()
      .fork(otherSaga, z + 1);
  });

  t.throws(_ => {
    saga
      .next()
      .take('HELLO')

      .next()
      .put({ type: 'ADD', payload: x + y })

      .next()
      .call(identity, y)

      .next()
      .fork(__ => {}, z);
  });
});

test('throws for an incorrect sequence', t => {
  t.throws(_ => {
    saga.next().call(__ => {});
  });
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
    .parallel([
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
    .parallel([
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
    .parallel([
      call(identity, 'parallel call'),
      put({ type: 'PARALLEL_PUT' }),
    ])

    .next()
    .fork(otherSaga, z)

    .next()
    .isDone();
});

test('.isDone throws if not done', t => {
  t.throws(_ => {
    saga.next().isDone();
  });
});

test('.returns if not done', t => {
  t.throws(_ => {
    testSaga(otherSaga, 1)
      .next()
      .returns(1);
  });
});

test('.returns if return value was not as expected', t => {
  t.throws(_ => {
    testSaga(otherSaga, 1)
      .next()
      .put({ type: 'OTHER', payload: 'hi' })
      .next()
      .returns('foobar');
  });
});

test('.returns does not throw if finished and return value matches', () => {
  testSaga(otherSaga, 1)
    .next()
    .put({ type: 'OTHER', payload: 'hi' })
    .next()
    .returns(1);
});
