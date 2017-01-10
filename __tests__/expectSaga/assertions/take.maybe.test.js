import { take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { errorRegex, unreachableError } from './_helper';

jest.mock('../../../src/utils/logging');

function* saga() {
  yield take.maybe('READY');
}

test('take.maybe assertion passes', () => (
  expectSaga(saga)
    .take.maybe('READY')
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
