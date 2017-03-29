import { fork, put, takeEvery } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { errorRegex, unreachableError } from './_helper';

jest.mock('../../../src/utils/logging');

function* otherSaga() {
  yield put({ type: 'FORKED' });
}

function* saga() {
  yield fork(otherSaga);
}

function* sagaWithTakeEvery() {
  yield takeEvery('TAKE_EVERY', otherSaga);
}

function* otherSagaWithArg(value) {
  yield put({ type: 'FORKED', payload: value });
}

function* sagaWithArg(value) {
  yield fork(otherSagaWithArg, value);
}

function* unusedSaga() {
  yield put({ type: 'FORKED' });
}

test('fork assertion passes', () => (
  expectSaga(saga)
    .fork(otherSaga)
    .run()
));

test('negative fork assertion passes', () => (
  expectSaga(saga)
    .not.fork(unusedSaga)
    .run()
));

test('fork assertion with arg passes', () => (
  expectSaga(sagaWithArg, 42)
    .fork(otherSagaWithArg, 42)
    .run()
));

test('negative fork assertion with arg passes', () => (
  expectSaga(sagaWithArg, 42)
    .not.fork(otherSagaWithArg, 43)
    .run()
));

test('forked saga runs', () => (
  expectSaga(saga)
    .put({ type: 'FORKED' })
    .run()
));

test('takeEvery saga runs', () => (
  expectSaga(sagaWithTakeEvery)
    .put({ type: 'FORKED' })
    .dispatch({ type: 'TAKE_EVERY' })
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

test('fork assertion fails', () => (
  expectSaga(saga)
    .not.fork(otherSaga)
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

test('negative fork assertion with arg fails', () => (
  expectSaga(sagaWithArg, 42)
    .not.fork(otherSagaWithArg, 42)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
