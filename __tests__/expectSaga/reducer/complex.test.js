// @flow
import { put, select, take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { errorRegex, unreachableError } from '../assertions/_helper';

const READY = 'READY';
const DONE = 'DONE';
const HAVE_BIRTHDAY = 'HAVE_BIRTHDAY';
const HAD_BIRTHDAY = 'HAD_BIRTHDAY';
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
  yield take(READY);

  const ageBefore = yield select(getAge);

  yield put({ type: AGE_BEFORE, payload: ageBefore });

  yield take(HAD_BIRTHDAY);

  const ageAfter = yield select(getAge);

  yield take(DONE);

  yield put({ type: AGE_AFTER, payload: ageAfter });
}

test('handles dispatches only for reducer', () => (
  expectSaga(saga)
    .withReducer(dogReducer)

    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 12 })

    .dispatch({ type: READY })
    .dispatch({ type: HAVE_BIRTHDAY })
    .dispatch({ type: HAD_BIRTHDAY })
    .dispatch({ type: DONE })

    .run()
));

test('fails with wrong put payload', () => (
  expectSaga(saga)
    .withReducer(dogReducer)

    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 11 })

    .dispatch({ type: READY })
    .dispatch({ type: HAVE_BIRTHDAY })
    .dispatch({ type: HAD_BIRTHDAY })
    .dispatch({ type: DONE })

    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
