import { cps, put } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
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

function unusedHandler(cb) {
  cb(null, DEFAULT_VALUE);
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

test('cps assertion passes', () =>
  expectSaga(saga)
    .cps(handler)
    .run());

test('cps matching fn assertion passes', () =>
  expectSaga(saga)
    .cps.fn(handler)
    .run());

test('negative cps assertion passes', () =>
  expectSaga(saga)
    .not.cps(unusedHandler)
    .run());

test('negative cps matching fn assertion passes', () =>
  expectSaga(saga)
    .not.cps.fn(unusedHandler)
    .run());

test('cps assertion with arg passes', () =>
  expectSaga(sagaWithArg, 42)
    .cps(handlerWithArg, 42)
    .run());

test('negative cps assertion with arg passes', () =>
  expectSaga(sagaWithArg, 42)
    .not.cps(handlerWithArg, 43)
    .run());

test('cps.like matching fn and args passes', () =>
  expectSaga(sagaWithArg, 42)
    .cps.like({ fn: handlerWithArg, args: [42] })
    .run());

test('negative cps.like matching fn and args passes with bad fn', () =>
  expectSaga(sagaWithArg, 42)
    .not.cps.like({ fn: unusedHandler, args: [42] })
    .run());

test('negative cps.like matching fn and args passes with bad args', () =>
  expectSaga(sagaWithArg, 42)
    .not.cps.like({ fn: handlerWithArg, args: [43] })
    .run());

test('negative cps.like matching fn and args passes with bad fn and args', () =>
  expectSaga(sagaWithArg, 42)
    .not.cps.like({ fn: unusedHandler, args: [43] })
    .run());

test('cps gives the default value', () =>
  expectSaga(saga)
    .put({ type: 'RESULT', payload: DEFAULT_VALUE })
    .run());

test('cps gives the supplied value', () =>
  expectSaga(sagaWithArg, 42)
    .put({ type: 'RESULT', payload: 42 })
    .run());

test('cps rejects with the error', () => {
  const error = new Error('whoops');

  return expectSaga(sagaWithError, error)
    .put({ type: 'RESULT', payload: error })
    .run();
});

test('cps assertion fails', () =>
  expectSaga(saga)
    .cps(unusedHandler)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative cps assertion fails', () =>
  expectSaga(saga)
    .not.cps(handler)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('cps matching assertion fails', () =>
  expectSaga(saga)
    .cps.fn(unusedHandler)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative cps matching assertion fails', () =>
  expectSaga(saga)
    .not.cps.fn(handler)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('cps assertion with arg fails', () =>
  expectSaga(sagaWithArg, 42)
    .cps(handlerWithArg, 43)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative cps assertion with arg fails', () =>
  expectSaga(sagaWithArg, 42)
    .not.cps(handlerWithArg, 42)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('cps assertion with error fails', () =>
  expectSaga(sagaWithError, new Error('whoops'))
    .cps(handlerWithError, new Error('foo'))
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative cps assertion with error fails', () => {
  const error = new Error('whoops');

  return expectSaga(sagaWithError, error)
    .not.cps(handlerWithError, error)
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    });
});
