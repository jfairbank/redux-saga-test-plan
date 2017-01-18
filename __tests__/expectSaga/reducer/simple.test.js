// @flow
import { put, select, take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

const HAVE_BIRTHDAY = 'HAVE_BIRTHDAY';
const AGE_BEFORE = 'AGE_BEFORE';
const AGE_AFTER = 'AGE_AFTER';

const initialDog = {
  name: 'Tucker',
  age: 11,
};

function dogReducer(state = initialDog, action) {
  if (action.type === HAVE_BIRTHDAY) {
    return {
      ...state,
      age: state.age + 1,
    };
  }

  return state;
}

function getAge(state) {
  return state.age;
}

function* saga() {
  const ageBefore = yield select(getAge);

  yield put({ type: AGE_BEFORE, payload: ageBefore });

  yield take(HAVE_BIRTHDAY);

  const ageAfter = yield select(getAge);

  yield put({ type: AGE_AFTER, payload: ageAfter });
}

test('handles reducers when not supplying initial state', () => (
  expectSaga(saga)
    .withReducer(dogReducer)
    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 12 })
    .dispatch({ type: HAVE_BIRTHDAY })
    .run()
));

test('handles reducers when supplying initial state', () => (
  expectSaga(saga)
    .withReducer(dogReducer, initialDog)
    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 12 })
    .dispatch({ type: HAVE_BIRTHDAY })
    .run()
));
