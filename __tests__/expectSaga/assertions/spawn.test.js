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

function* unusedSaga() {
  yield put({ type: 'SPAWNED' });
}

test('spawn assertion passes', () => (
  expectSaga(saga)
    .spawn(otherSaga)
    .run()
));

test('spawn matching assertion fn passes', () => (
  expectSaga(saga)
    .spawn.fn(otherSaga)
    .run()
));

test('negative spawn assertion passes', () => (
  expectSaga(saga)
    .not.spawn(unusedSaga)
    .run()
));

test('negative spawn matching assertion fn passes', () => (
  expectSaga(saga)
    .not.spawn.fn(unusedSaga)
    .run()
));

test('spawn assertion with arg passes', () => (
  expectSaga(sagaWithArg, 42)
    .spawn(otherSagaWithArg, 42)
    .run()
));

test('negative spawn assertion with arg passes', () => (
  expectSaga(sagaWithArg, 42)
    .not.spawn(otherSagaWithArg, 43)
    .run()
));

test('spawn.like matching fn and args passes', () => (
  expectSaga(sagaWithArg, 42)
    .spawn.like({ fn: otherSagaWithArg, args: [42] })
    .run()
));

test('negative spawn.like matching fn and args passes with bad fn', () => (
  expectSaga(sagaWithArg, 42)
    .not.spawn.like({ fn: unusedSaga, args: [42] })
    .run()
));

test('negative spawn.like matching fn and args passes with bad args', () => (
  expectSaga(sagaWithArg, 42)
    .not.spawn.like({ fn: otherSagaWithArg, args: [43] })
    .run()
));

test('negative spawn.like matching fn and args passes with bad fn and args', () => (
  expectSaga(sagaWithArg, 42)
    .not.spawn.like({ fn: unusedSaga, args: [43] })
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

test('negative spawn assertion fails', () => (
  expectSaga(saga)
    .not.spawn(otherSaga)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('spawn matching assertion fn fails', () => (
  expectSaga(saga)
    .spawn.fn(otherSagaWithArg)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('negative spawn matching assertion fn fails', () => (
  expectSaga(saga)
    .not.spawn.fn(otherSaga)
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

test('negative spawn assertion with arg fails', () => (
  expectSaga(sagaWithArg, 42)
    .not.spawn(otherSagaWithArg, 42)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
