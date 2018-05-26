// @flow
import { all, call, put } from 'redux-saga/effects';
import testSaga from 'testSaga';
import identity from 'utils/identity';

function* mainSaga() {
  yield all([call(identity), put({ type: 'FOO' })]);
}

function* mainSagaWithObject() {
  yield all({
    theCall: call(identity),
    thePut: put({ type: 'FOO' }),
  });
}

it('handles all', () => {
  testSaga(mainSaga)
    .next()
    .all([call(identity), put({ type: 'FOO' })]);
});

it('throws if call wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .all([call(() => {}), put({ type: 'FOO' })]);
  }).toThrow();
});

it('throws if put wrong', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .all([call(identity), put({ type: 'BAR' })]);
  }).toThrow();
});

it('handles objects', () => {
  testSaga(mainSagaWithObject)
    .next()
    .all({
      theCall: call(identity),
      thePut: put({ type: 'FOO' }),
    });
});
