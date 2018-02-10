import { put } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { errorRegex, unreachableError } from './_helper';

function* saga() {
  yield put.resolve({ type: 'READY', payload: 42 });
}

test('put.resolve assertion passes', () =>
  expectSaga(saga)
    .put.resolve({ type: 'READY', payload: 42 })
    .run());

test('put.resolve matching assertion passes', () =>
  expectSaga(saga)
    .put.resolve.actionType('READY')
    .run());

test('negative put.resolve assertion passes with wrong type', () =>
  expectSaga(saga)
    .not.put.resolve({ type: 'FOO', payload: 42 })
    .run());

test('negative put.resolve matching assertion passes with wrong type', () =>
  expectSaga(saga)
    .not.put.resolve.actionType('FOO')
    .run());

test('negative put.resolve assertion passes with wrong payload', () =>
  expectSaga(saga)
    .not.put.resolve({ type: 'READY', payload: 43 })
    .run());

test('put.resolve assertion fails with wrong type', () =>
  expectSaga(saga)
    .put.resolve({ type: 'FOO', payload: 42 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('put.resolve matching assertion fails with wrong type', () =>
  expectSaga(saga)
    .put.resolve.actionType('FOO')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative put.resolve matching assertion fails with correct type', () =>
  expectSaga(saga)
    .not.put.resolve.actionType('READY')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('put.resolve assertion fails with wrong payload', () =>
  expectSaga(saga)
    .put.resolve({ type: 'READY', payload: 43 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative put.resolve assertion fails with correct payload', () =>
  expectSaga(saga)
    .not.put.resolve({ type: 'READY', payload: 42 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));
