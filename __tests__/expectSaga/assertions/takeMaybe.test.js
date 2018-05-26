import { takeMaybe } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { errorRegex, unreachableError } from './_helper';

jest.mock('utils/logging');

function* saga() {
  yield takeMaybe('READY');
}

test('takeMaybe assertion passes', () =>
  expectSaga(saga)
    .takeMaybe('READY')
    .run());

test('negative takeMaybe assertion passes', () =>
  expectSaga(saga)
    .not.takeMaybe('FOO')
    .run());

test('takeMaybe assertion fails', () =>
  expectSaga(saga)
    .takeMaybe('FOO')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative takeMaybe assertion fails', () =>
  expectSaga(saga)
    .not.takeMaybe('READY')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));
