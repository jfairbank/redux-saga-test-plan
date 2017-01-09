import { fork, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { errorRegex, unreachableError } from './_helper';

function* otherSaga() {
  yield put({ type: 'FORKED' });
}

function* saga() {
  yield fork(otherSaga);
}

function* otherSagaWithArg(value) {
  yield put({ type: 'FORKED', payload: value });
}

function* sagaWithArg(value) {
  yield fork(otherSagaWithArg, value);
}

test('fork assertion passes', () => (
  expectSaga(saga)
    .fork(otherSaga)
    .run()
));

test('fork assertion with arg passes', () => (
  expectSaga(sagaWithArg, 42)
    .fork(otherSagaWithArg, 42)
    .run()
));

test('forked saga runs', () => (
  expectSaga(saga)
    .put({ type: 'FORKED' })
    .run()
));

test('forked saga with arg runs', () => (
  expectSaga(sagaWithArg, 42)
    .put({ type: 'FORKED', payload: 42 })
    .run()
));

test('fork assertion fails', () => (
  expectSaga(saga)
    .fork(otherSagaWithArg)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('fork assertion with arg fails', () => (
  expectSaga(sagaWithArg, 42)
    .fork(otherSagaWithArg, 43)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
