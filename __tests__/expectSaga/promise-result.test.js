import { call, fork, put, take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import identity from 'utils/identity';

test('exposes the effects in the promise result', async () => {
  function* saga() {
    yield call(identity, 42);
    yield put({ type: 'FOO' });
    yield put({ type: 'BAR', payload: 'hello' });
  }

  const { effects } = await expectSaga(saga).run();

  expect(effects.call).toHaveLength(1);
  expect(effects.put).toHaveLength(2);

  expect(effects.call[0]).toEqual(call(identity, 42));
  expect(effects.put[0]).toEqual(put({ type: 'FOO' }));
  expect(effects.put[1]).toEqual(put({ type: 'BAR', payload: 'hello' }));
});

test('exposes the effects from forked sagas in the promise result', async () => {
  function* backgroundSaga() {
    yield put({ type: 'FOO' });
    yield call(identity, 42);
  }

  function* saga() {
    yield take('HELLO');
    yield fork(backgroundSaga);
    yield put({ type: 'BAR', payload: 'world' });
  }

  const { effects } = await expectSaga(saga)
    .dispatch({ type: 'HELLO' })
    .run();

  expect(effects.call).toHaveLength(1);
  expect(effects.fork).toHaveLength(1);
  expect(effects.put).toHaveLength(2);
  expect(effects.take).toHaveLength(1);

  expect(effects.call[0]).toEqual(call(identity, 42));
  expect(effects.put).toContainEqual(put({ type: 'FOO' }));
  expect(effects.put).toContainEqual(put({ type: 'BAR', payload: 'world' }));
});
