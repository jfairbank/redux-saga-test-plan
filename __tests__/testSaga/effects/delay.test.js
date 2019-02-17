// @flow
import { delay } from 'redux-saga/effects';
import testSaga from 'testSaga';

function* mainSaga() {
  yield delay(500, 'a');
}

test('handles delay effect', () => {
  testSaga(mainSaga)
    .next()
    .delay(500, 'a');
});
