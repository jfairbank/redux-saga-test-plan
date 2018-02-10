import { apply } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import identity from '../../../src/utils/identity';
import { errorRegex, unreachableError } from './_helper';

const context = {
  identity,
  foo() {},
  hello: 'world',
};

function* saga() {
  yield apply(context, 'identity');
}

function* sagaWithArg(x, y) {
  yield apply(context, 'identity', [x, y]);
}

test('apply assertion passes', () =>
  expectSaga(saga)
    .apply(context, 'identity')
    .run());

test('negative apply assertion passes', () =>
  expectSaga(saga)
    .not.apply(context, 'foo')
    .run());

test('apply assertion with arg passes', () =>
  expectSaga(sagaWithArg, 42, 'foo')
    .apply(context, 'identity', [42, 'foo'])
    .run());

test('negative apply assertion with wrong arg passes', () =>
  expectSaga(sagaWithArg, 42, 'foo')
    .not.apply(context, identity, [43, 'foo'])
    .run());

test('apply matching fn passes', () =>
  expectSaga(sagaWithArg, 42)
    .apply.fn(identity)
    .run());

test('negative apply matching fn passes', () =>
  expectSaga(sagaWithArg, 42)
    .not.apply.fn(() => {})
    .run());

test('apply.like matching fn and args passes', () =>
  expectSaga(sagaWithArg, 42)
    .apply.like({ fn: identity, args: [42] })
    .run());

test('negative apply.like matching fn and args passes with bad fn', () =>
  expectSaga(sagaWithArg, 42)
    .not.apply.like({ fn: () => {}, args: [42] })
    .run());

test('negative apply.like matching fn and args passes with bad args', () =>
  expectSaga(sagaWithArg, 42)
    .not.apply.like({ fn: identity, args: [43] })
    .run());

test('negative apply.like matching fn and args passes with bad fn and args', () =>
  expectSaga(sagaWithArg, 42)
    .not.apply.like({ fn: () => {}, args: [43] })
    .run());

test('apply assertion fails with wrong function', () =>
  expectSaga(saga)
    .apply(context, 'foo')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative apply assertion fails with correct function', () =>
  expectSaga(saga)
    .not.apply(context, 'identity')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('apply matching assertion fails', () =>
  expectSaga(saga)
    .apply.fn(context.foo)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative apply matching assertion fails', () =>
  expectSaga(saga)
    .not.apply.fn(identity)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('apply assertion fails with wrong context', () =>
  expectSaga(saga)
    .apply({ identity }, 'identity')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative apply assertion fails with correct context', () =>
  expectSaga(saga)
    .not.apply(context, 'identity')
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('apply assertion with wrong arg fails', () =>
  expectSaga(sagaWithArg, 42, 'foo')
    .apply(context, 'identity', [42, 'bar'])
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative apply assertion with correct arg fails', () =>
  expectSaga(sagaWithArg, 42, 'foo')
    .not.apply(context, 'identity', [42, 'foo'])
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));
