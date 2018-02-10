// @flow
import { put, select, take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';

const READY = 'READY';
const BARK = 'BARK';
const BARK_COUNT_BEFORE = 'BARK_COUNT_BEFORE';
const BARK_COUNT_AFTER = 'BARK_COUNT_AFTER';

const initialDog = {
  name: 'Tucker',
  barkCount: 11,
};

function dogReducer(state = initialDog, action) {
  if (action.type === BARK) {
    return {
      ...state,
      barkCount: state.barkCount + 1,
    };
  }

  return state;
}

function getBarkCount(state) {
  return state.barkCount;
}

function* saga() {
  yield take(READY);

  const barkCountBefore = yield select(getBarkCount);

  yield put({ type: BARK_COUNT_BEFORE, payload: barkCountBefore });

  yield put({ type: BARK });

  const barkCountAfter = yield select(getBarkCount);

  yield put({ type: BARK_COUNT_AFTER, payload: barkCountAfter });
}

test('handles puts from within saga sequentially', () =>
  expectSaga(saga)
    .withReducer(dogReducer)

    .put({ type: BARK_COUNT_BEFORE, payload: 11 })
    .put({ type: BARK_COUNT_AFTER, payload: 12 })

    .dispatch({ type: READY })

    .run());
