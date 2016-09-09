/* @flow */
import test from 'ava';
import { call, fork, put, take } from 'redux-saga/effects';
import { testSaga } from '../src';

const identity = value => value;

function* otherSaga() {
  yield put({ type: 'OTHER', payload: 'hi' });
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

test('executes callback passed to yields with actual yielded value', t => {
  saga
    .next()
    .yields((actualValue) => {
      t.deepEqual(actualValue, take('HELLO'))
    })
    .next(action).put({ type: 'ADD', payload: x + y })
    .next().call(identity, action)
    .next().fork(otherSaga, z)
    .next().isDone();
});
