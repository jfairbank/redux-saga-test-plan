import { putResolve } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { errorRegex, unreachableError } from './_helper';

function* saga() {
  yield putResolve({ type: 'READY', payload: 42 });
}

test('putResolve assertion passes', () =>
  expectSaga(saga)
    .putResolve({ type: 'READY', payload: 42 })
    .run());

test('putResolve matching assertion passes', () =>
  expectSaga(saga)
    .putResolve.actionType('READY')
    .run());

test('negative putResolve assertion passes with wrong type', () =>
  expectSaga(saga)
    .not.putResolve({ type: 'FOO', payload: 42 })
    .run());

test('negative putResolve matching assertion passes with wrong type', () =>
  expectSaga(saga)
    .not.putResolve.actionType('FOO')
    .run());

test('negative putResolve assertion passes with wrong payload', () =>
  expectSaga(saga)
    .not.putResolve({ type: 'READY', payload: 43 })
    .run());

test('putResolve assertion fails with wrong type', () =>
  expectSaga(saga)
    .putResolve({ type: 'FOO', payload: 42 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('putResolve matching assertion fails with wrong type', () =>
  expectSaga(saga)
    .putResolve.actionType('FOO')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative putResolve matching assertion fails with correct type', () =>
  expectSaga(saga)
    .not.putResolve.actionType('READY')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('putResolve assertion fails with wrong payload', () =>
  expectSaga(saga)
    .putResolve({ type: 'READY', payload: 43 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative putResolve assertion fails with correct payload', () =>
  expectSaga(saga)
    .not.putResolve({ type: 'READY', payload: 42 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));
