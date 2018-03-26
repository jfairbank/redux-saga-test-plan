// @flow
import { getContext, setContext } from 'redux-saga/effects';
import testSaga from 'testSaga';

it('handles getContext', () => {
  function* mainSaga() {
    yield getContext('foo');
  }

  testSaga(mainSaga)
    .next()
    .getContext('foo');
});

it('handles setContext', () => {
  function* mainSaga() {
    yield setContext({ foo: 42 });
  }

  testSaga(mainSaga)
    .next()
    .setContext({ foo: 42 });
});
