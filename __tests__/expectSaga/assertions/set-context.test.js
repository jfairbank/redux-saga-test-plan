import { setContext } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { errorRegex, unreachableError } from './_helper';

function* saga() {
  yield setContext({ answer: 42 });
}

test('setContext assertion passes', () =>
  expectSaga(saga)
    .setContext({ answer: 42 })
    .run());

test('negative setContext assertion passes with wrong properties', () =>
  expectSaga(saga)
    .not.setContext({ answer: 41 })
    .run());

test('setContext assertion fails with wrong properties', () =>
  expectSaga(saga)
    .setContext({ answer: 41 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative setContext assertion fails with correct properties', () =>
  expectSaga(saga)
    .not.setContext({ answer: 42 })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));
