import { put } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { errorRegex, unreachableError } from './_helper';

function* saga() {
  yield put({ type: 'READY', payload: 42 });
}

test('put assertion passes', () =>
  expectSaga(saga)
    .put({ type: 'READY', payload: 42 })
    .run());

test('put matching assertion action type passes', () =>
  expectSaga(saga)
    .put.actionType('READY')
    .run());

test('negative put assertion passes with wrong type', () =>
  expectSaga(saga)
    .not.put({ type: 'FOO', payload: 42 })
    .run());

test('negative put matching assertion passes with wrong type', () =>
  expectSaga(saga)
    .not.put.actionType('FOO')
    .run());

test('negative put assertion passes with wrong payload', () =>
  expectSaga(saga)
    .not.put({ type: 'READY', payload: 43 })
    .run());

test('put assertion fails with wrong type', () =>
  expectSaga(saga)
    .put({ type: 'FOO', payload: 42 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('put matching assertion fails with wrong type', () =>
  expectSaga(saga)
    .put.actionType({ type: 'FOO', payload: 42 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative put assertion fails with correct type', () =>
  expectSaga(saga)
    .not.put({ type: 'READY', payload: 42 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative put matching assertion fails with correct type', () =>
  expectSaga(saga)
    .not.put.actionType('READY')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('put assertion fails with wrong payload', () =>
  expectSaga(saga)
    .put({ type: 'READY', payload: 43 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative put assertion fails with correct payload', () =>
  expectSaga(saga)
    .not.put({ type: 'READY', payload: 42 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));
