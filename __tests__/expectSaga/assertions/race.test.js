import { call, race, put, take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { delay } from 'utils/async';
import { errorRegex, unreachableError } from './_helper';

function quickFetchData() {
  return Promise.resolve({});
}

function slowFetchData() {
  return delay(500).then(() => ({}));
}

function* saga(fetchData) {
  const { success } = yield race({
    success: call(fetchData),
    cancel: take('CANCEL'),
  });

  yield put({ type: 'DONE', success: !!success });
}

function* sagaWithArray(fetchData) {
  const [success] = yield race([call(fetchData), take('CANCEL')]);

  yield put({ type: 'DONE', success: !!success });
}

test('race assertion passes', () =>
  expectSaga(saga, quickFetchData)
    .race({
      success: call(quickFetchData),
      cancel: take('CANCEL'),
    })
    .run());

test('race assertion with array passes', () =>
  expectSaga(sagaWithArray, quickFetchData)
    .race([call(quickFetchData), take('CANCEL')])
    .run());

test('negative race assertion passes with wrong success', () =>
  expectSaga(saga, quickFetchData)
    .not.race({
      success: call(() => {}),
      cancel: take('CANCEL'),
    })
    .run());

test('negative race assertion passes with wrong cancel', () =>
  expectSaga(saga, quickFetchData)
    .not.race({
      success: call(quickFetchData),
      cancel: take('FOO'),
    })
    .run());

test('success branch wins', () =>
  expectSaga(saga, quickFetchData)
    .put({ type: 'DONE', success: true })
    .run());

test('cancel branch wins', () =>
  expectSaga(saga, slowFetchData)
    .put({ type: 'DONE', success: false })
    .dispatch({ type: 'CANCEL' })
    .run(600));

test('race assertion fails with wrong cancel', () =>
  expectSaga(saga, quickFetchData)
    .race({
      success: call(quickFetchData),
      cancel: take('FOO'),
    })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('race assertion fails with wrong success', () =>
  expectSaga(saga, quickFetchData)
    .race({
      success: call(() => {}),
      cancel: take('CANCEL'),
    })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('negative race assertion fails with correct success and cancel', () =>
  expectSaga(saga, quickFetchData)
    .not.race({
      success: call(quickFetchData),
      cancel: take('CANCEL'),
    })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));
