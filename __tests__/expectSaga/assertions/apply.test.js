import { apply } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import identity from '../../../src/utils/identity';
import { errorRegex, unreachableError } from './_helper';

const context = { hello: 'world' };

function* saga() {
  yield apply(context, identity);
}

function* sagaWithArg(x, y) {
  yield apply(context, identity, [x, y]);
}

test('apply assertion passes', () => (
  expectSaga(saga)
    .apply(context, identity)
    .run()
));

test('apply assertion with arg passes', () => (
  expectSaga(sagaWithArg, 42, 'foo')
    .apply(context, identity, [42, 'foo'])
    .run()
));

test('apply assertion fails with wrong function', () => (
  expectSaga(saga)
    .apply(context, () => {})
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('apply assertion fails with wrong context', () => (
  expectSaga(saga)
    .apply({}, identity)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('apply assertion with wrong arg fails', () => (
  expectSaga(sagaWithArg, 42, 'foo')
    .apply(context, identity, [42, 'bar'])
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
