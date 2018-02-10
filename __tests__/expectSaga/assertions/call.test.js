import { call } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import identity from 'utils/identity';
import { errorRegex, unreachableError } from './_helper';

function* saga() {
  yield call(identity);
}

function* sagaWithArg(x) {
  yield call(identity, x);
}

test('call assertion passes', () =>
  expectSaga(saga)
    .call(identity)
    .run());

test('negative call assertion passes', () =>
  expectSaga(saga)
    .not.call(() => {})
    .run());

test('call assertion with arg passes', () =>
  expectSaga(sagaWithArg, 42)
    .call(identity, 42)
    .run());

test('negative call assertion with arg passes', () =>
  expectSaga(sagaWithArg, 42)
    .not.call(identity, 43)
    .run());

test('call matching fn passes', () =>
  expectSaga(sagaWithArg, 42)
    .call.fn(identity)
    .run());

test('negative call matching fn passes', () =>
  expectSaga(sagaWithArg, 42)
    .not.call.fn(() => {})
    .run());

test('call.like matching fn and args passes', () =>
  expectSaga(sagaWithArg, 42)
    .call.like({ fn: identity, args: [42] })
    .run());

test('negative call.like matching fn and args passes with bad fn', () =>
  expectSaga(sagaWithArg, 42)
    .not.call.like({ fn: () => {}, args: [42] })
    .run());

test('negative call.like matching fn and args passes with bad args', () =>
  expectSaga(sagaWithArg, 42)
    .not.call.like({ fn: identity, args: [43] })
    .run());

test('negative call.like matching fn and args passes with bad fn and args', () =>
  expectSaga(sagaWithArg, 42)
    .not.call.like({ fn: () => {}, args: [43] })
    .run());

test('call assertion fails', () =>
  expectSaga(saga)
    .call(() => {})
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative call assertion fails', () =>
  expectSaga(saga)
    .not.call(identity)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('call matching assertion fails', () =>
  expectSaga(saga)
    .call.fn(() => {})
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative call matching assertion fails', () =>
  expectSaga(saga)
    .not.call.fn(identity)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('call assertion with arg fails', () =>
  expectSaga(sagaWithArg, 42)
    .call(identity, 43)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative call assertion with arg fails', () =>
  expectSaga(sagaWithArg, 42)
    .not.call(identity, 42)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));
