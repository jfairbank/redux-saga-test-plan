import { take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { errorRegex, unreachableError } from './_helper';

jest.mock('../../../src/utils/logging');

function* saga() {
  yield take('READY');
}

test('take assertion passes', () => (
  expectSaga(saga)
    .take('READY')
    .run()
));

test('negative take assertion passes', () => (
  expectSaga(saga)
    .not.take('FOO')
    .run()
));

test('take assertion fails', () => (
  expectSaga(saga)
    .take('FOO')
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('negative take assertion fails', () => (
  expectSaga(saga)
    .not.take('READY')
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
