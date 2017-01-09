import { call } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import identity from '../../../src/utils/identity';
import { errorRegex, unreachableError } from './_helper';

function* saga() {
  yield call(identity);
}

function* sagaWithArg(x) {
  yield call(identity, x);
}

test('call assertion passes', () => (
  expectSaga(saga)
    .call(identity)
    .run()
));

test('call assertion with arg passes', () => (
  expectSaga(sagaWithArg, 42)
    .call(identity, 42)
    .run()
));

test('call assertion fails', () => (
  expectSaga(saga)
    .call(() => {})
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('call assertion with arg fails', () => (
  expectSaga(sagaWithArg, 42)
    .call(identity, 43)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
