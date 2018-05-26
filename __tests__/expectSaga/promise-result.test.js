import { call, fork, put, take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import isEqual from 'lodash.isequal';
import identity from 'utils/identity';

test('exposes the effects in the promise result', async () => {
  function* saga() {
    yield call(identity, 42);
    yield put({ type: 'FOO' });
    yield put({ type: 'BAR', payload: 'hello' });
  }

  const { effects, toJSON } = await expectSaga(saga).run();

  expect(effects.call).toHaveLength(1);
  expect(effects.put).toHaveLength(2);

  // Jest Symbol comparison seems to be intermittently broken, so using isEqual
  // https://github.com/facebook/jest/issues/4592
  expect(isEqual(effects.call[0], call(identity, 42))).toBe(true);
  expect(isEqual(effects.put[0], put({ type: 'FOO' }))).toBe(true);
  expect(isEqual(effects.put[1], put({ type: 'BAR', payload: 'hello' }))).toBe(
    true,
  );

  expect(toJSON()).toMatchSnapshot();
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

  const { effects, toJSON } = await expectSaga(saga)
    .dispatch({ type: 'HELLO' })
    .run();

  expect(effects.call).toHaveLength(1);
  expect(effects.fork).toHaveLength(1);
  expect(effects.put).toHaveLength(2);
  expect(effects.take).toHaveLength(1);

  // Jest Symbol comparison seems to be intermittently broken, so using isEqual
  // https://github.com/facebook/jest/issues/4592
  expect(isEqual(effects.call[0], call(identity, 42))).toBe(true);
  expect(effects.put.some(effect => isEqual(effect, put({ type: 'FOO' }))));
  expect(
    effects.put.some(effect =>
      isEqual(effect, put({ type: 'BAR', payload: 'world' })),
    ),
  );

  expect(toJSON()).toMatchSnapshot();
});

test('exposes the return value', async () => {
  const expected = 42;

  // eslint-disable-next-line require-yield
  function* saga() {
    return expected;
  }

  const { returnValue } = await expectSaga(saga).run();

  expect(returnValue).toBe(expected);
});

test('exposes return value of undefined with no explicit return', async () => {
  function* saga() {
    yield call(() => {});
  }

  const { returnValue } = await expectSaga(saga).run();

  expect(returnValue).toBe(undefined);
});

test('test coverage for snapshot testing call of anonymous function', async () => {
  function* saga() {
    yield call(() => {});
  }

  const { toJSON } = await expectSaga(saga).run();

  expect(toJSON()).toMatchSnapshot();
});

test('exposes all yielded effects in order', () => {
  function* saga() {
    yield call(identity, 42);
    yield put({ type: 'HELLO' });
  }

  return expectSaga(saga)
    .run()
    .then(result => {
      expect(result.allEffects).toHaveLength(2);

      // Jest Symbol comparison seems to be intermittently broken, so using isEqual
      // https://github.com/facebook/jest/issues/4592
      expect(isEqual(result.allEffects[0], call(identity, 42))).toBe(true);
      expect(isEqual(result.allEffects[1], put({ type: 'HELLO' }))).toBe(true);
    });
});
