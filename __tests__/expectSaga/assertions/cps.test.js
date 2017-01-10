import { cps, put } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { errorRegex, unreachableError } from './_helper';

const DEFAULT_VALUE = 'default value';

function handler(cb) {
  cb(null, DEFAULT_VALUE);
}

function handlerWithArg(value, cb) {
  cb(null, value);
}

function handlerWithError(error, cb) {
  cb(error);
}

function* saga() {
  const result = yield cps(handler);
  yield put({ type: 'RESULT', payload: result });
}

function* sagaWithArg(value) {
  const result = yield cps(handlerWithArg, value);
  yield put({ type: 'RESULT', payload: result });
}

function* sagaWithError(error) {
  try {
    yield cps(handlerWithError, error);
  } catch (e) {
    yield put({ type: 'RESULT', payload: e });
  }
}

test('cps assertion passes', () => (
  expectSaga(saga)
    .cps(handler)
    .run()
));

test('cps assertion with arg passes', () => (
  expectSaga(sagaWithArg, 42)
    .cps(handlerWithArg, 42)
    .run()
));

test('cps gives the default value', () => (
  expectSaga(saga)
    .put({ type: 'RESULT', payload: DEFAULT_VALUE })
    .run()
));

test('cps gives the supplied value', () => (
  expectSaga(sagaWithArg, 42)
    .put({ type: 'RESULT', payload: 42 })
    .run()
));

test('cps rejects with the error', () => {
  const error = new Error('whoops');

  return expectSaga(sagaWithError, error)
    .put({ type: 'RESULT', payload: error })
    .run();
});

test('cps assertion fails', () => (
  expectSaga(saga)
    .cps(() => {})
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('cps assertion with arg fails', () => (
  expectSaga(sagaWithArg, 42)
    .cps(handlerWithArg, 43)
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('cps assertion with error fails', () => (
  expectSaga(sagaWithError, new Error('whoops'))
    .cps(handlerWithError, new Error('foo'))
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
