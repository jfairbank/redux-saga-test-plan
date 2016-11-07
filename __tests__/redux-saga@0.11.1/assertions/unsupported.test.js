// @flow
import niv from 'npm-install-version';
import createTestSaga from '../../../src/createTestSaga';

const reduxSaga = niv.require('redux-saga@0.11.1');
const { put } = reduxSaga.effects;

const testSaga = createTestSaga(reduxSaga);

function* mainSaga() {
  yield put({ type: 'DONE' });
}

test('does not support flush', () => {
  expect(_ => {
    testSaga(mainSaga)
      .next()
      .flush({});
  }).toThrowError(
    'The flush effect is not available in your version of redux-saga',
  );
});
