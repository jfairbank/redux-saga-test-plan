import { spawn, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { errorRegex, unreachableError } from './_helper';

function* otherSaga() {
  yield put({ type: 'SPAWNED' });
}

function* saga() {
  yield spawn(otherSaga);
}

function* otherSagaWithArg(value) {
  yield put({ type: 'SPAWNED', payload: value });
}

function* sagaWithArg(value) {
  yield spawn(otherSagaWithArg, value);
}

test('spawn assertion passes', () => (
  expectSaga(saga)
    .spawn(otherSaga)
    .run()
));

test('spawn assertion with arg passes', () => (
  expectSaga(sagaWithArg, 42)
    .spawn(otherSagaWithArg, 42)
    .run()
));

test('spawned saga runs', () => (
  expectSaga(saga)
    .put({ type: 'SPAWNED' })
    .run()
));

test('spawned saga with arg runs', () => (
  expectSaga(sagaWithArg, 42)
    .put({ type: 'SPAWNED', payload: 42 })
    .run()
));

test('spawn assertion fails', () => (
  expectSaga(saga)
    .spawn(otherSagaWithArg)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('spawn assertion with arg fails', () => (
  expectSaga(sagaWithArg, 42)
    .spawn(otherSagaWithArg, 43)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
