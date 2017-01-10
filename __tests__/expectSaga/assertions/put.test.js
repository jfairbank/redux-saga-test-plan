import { put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { errorRegex, unreachableError } from './_helper';

function* saga() {
  yield put({ type: 'READY', payload: 42 });
}

test('put assertion passes', () => (
  expectSaga(saga)
    .put({ type: 'READY', payload: 42 })
    .run()
));

test('put assertion fails with wrong type', () => (
  expectSaga(saga)
    .put({ type: 'FOO', payload: 42 })
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('put assertion fails with wrong payload', () => (
  expectSaga(saga)
    .put({ type: 'READY', payload: 43 })
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
