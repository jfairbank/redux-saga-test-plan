import { actionChannel, put, take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { errorRegex, unreachableError } from './_helper';

function* saga() {
  const channel = yield actionChannel('FOO');
  const { payload } = yield take(channel);

  yield put({ payload, type: 'DONE' });
}

test('actionChannel assertion passes', () => (
  expectSaga(saga)
    .actionChannel('FOO')
    .run()
));

test('actionChannel works with take', () => (
  expectSaga(saga)
    .put({ type: 'DONE', payload: 42 })
    .dispatch({ type: 'FOO', payload: 42 })
    .run()
));

test('actionChannel assertion fails', () => (
  expectSaga(saga)
    .actionChannel('BAR')
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('actionChannel fails with wrong take type', () => (
  expectSaga(saga)
    .put({ type: 'WRONG', payload: 42 })
    .dispatch({ type: 'FOO', payload: 42 })
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('actionChannel fails with wrong take payload', () => (
  expectSaga(saga)
    .put({ type: 'DONE', payload: 43 })
    .dispatch({ type: 'FOO', payload: 42 })
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
