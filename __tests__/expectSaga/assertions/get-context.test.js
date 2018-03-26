import { getContext } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { errorRegex, unreachableError } from './_helper';

function* saga() {
  yield getContext('theAnswer');
}

test('getContext assertion passes', () =>
  expectSaga(saga)
    .getContext('theAnswer')
    .run());

test('negative getContext assertion passes with wrong property name', () =>
  expectSaga(saga)
    .not.getContext('wrongAnswer')
    .run());

test('getContext assertion fails with wrong property name', () =>
  expectSaga(saga)
    .getContext('wrongAnswer')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative getContext assertion fails with correct property name', () =>
  expectSaga(saga)
    .not.getContext('theAnswer')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));
