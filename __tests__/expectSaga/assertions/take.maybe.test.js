import { take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { errorRegex, unreachableError } from './_helper';

jest.mock('utils/logging');

function* saga() {
  yield take.maybe('READY');
}

test('take.maybe assertion passes', () => (
  expectSaga(saga)
    .take.maybe('READY')
    .run()
));

test('negative take.maybe assertion passes', () => (
  expectSaga(saga)
    .not.take.maybe('FOO')
    .run()
));

test('take.maybe assertion fails', () => (
  expectSaga(saga)
    .take.maybe('FOO')
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('negative take.maybe assertion fails', () => (
  expectSaga(saga)
    .not.take.maybe('READY')
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
