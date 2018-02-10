// @flow
import { put, select, take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import { errorRegex, unreachableError } from '../assertions/_helper';

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

test('handles reducers when not supplying initial state', () =>
  expectSaga(saga)
    .withReducer(dogReducer)
    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 12 })
    .dispatch({ type: HAVE_BIRTHDAY })
    .run());

test('handles reducers when supplying initial state', () =>
  expectSaga(saga)
    .withReducer(dogReducer, initialDog)
    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 12 })
    .dispatch({ type: HAVE_BIRTHDAY })
    .run());

test('fails with wrong put payload', () =>
  expectSaga(saga)
    .withReducer(dogReducer)

    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 11 })

    .dispatch({ type: HAVE_BIRTHDAY })

    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(errorRegex);
    }));

test('tests and exposes changed store state with no initial state', async () => {
  const expectedFinalState = {
    name: 'Tucker',
    age: 12,
  };

  const { storeState } = await expectSaga(saga)
    .withReducer(dogReducer)
    .hasFinalState(expectedFinalState)
    .dispatch({ type: HAVE_BIRTHDAY })
    .run();

  expect(storeState).toEqual(expectedFinalState);
});

test('tests and exposes changed store state with initial state', async () => {
  const expectedFinalState = {
    name: 'Tucker',
    age: 12,
  };

  const { storeState } = await expectSaga(saga, initialDog)
    .withReducer(dogReducer)
    .hasFinalState(expectedFinalState)
    .dispatch({ type: HAVE_BIRTHDAY })
    .run();

  expect(storeState).toEqual(expectedFinalState);
});

test('tests negated store state with no initial state', () => {
  const unexpectedFinalState = {
    name: 'Tucker',
    age: 11,
  };

  return (
    expectSaga(saga)
      .withReducer(dogReducer)
      // $FlowFixMe
      .not.hasFinalState(unexpectedFinalState)
      .dispatch({ type: HAVE_BIRTHDAY })
      .run()
  );
});

test('tests negated store state with initial state', () => {
  const unexpectedFinalState = {
    name: 'Tucker',
    age: 11,
  };

  return (
    expectSaga(saga, initialDog)
      .withReducer(dogReducer)
      // $FlowFixMe
      .not.hasFinalState(unexpectedFinalState)
      .dispatch({ type: HAVE_BIRTHDAY })
      .run()
  );
});

test('hasFinalState fails with incorrect state without initial state', () => {
  const incorrectFinalState = {
    name: 'Tucker',
    age: 11,
  };

  return expectSaga(saga)
    .withReducer(dogReducer)
    .hasFinalState(incorrectFinalState)
    .dispatch({ type: HAVE_BIRTHDAY })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(/Expected to have final store state/);
    });
});

test('hasFinalState fails with incorrect state with initial state', () => {
  const incorrectFinalState = {
    name: 'Tucker',
    age: 11,
  };

  return expectSaga(saga)
    .withReducer(dogReducer, initialDog)
    .hasFinalState(incorrectFinalState)
    .dispatch({ type: HAVE_BIRTHDAY })
    .run()
    .then(unreachableError)
    .catch(e => {
      expect(e.message).toMatch(/Expected to have final store state/);
    });
});

test('negated hasFinalState fails with correct state without initial state', () => {
  const correctFinalState = {
    name: 'Tucker',
    age: 12,
  };

  return (
    expectSaga(saga)
      .withReducer(dogReducer)
      // $FlowFixMe
      .not.hasFinalState(correctFinalState)
      .dispatch({ type: HAVE_BIRTHDAY })
      .run()
      .then(unreachableError)
      .catch(e => {
        expect(e.message).toMatch(/Expected to not have final store state/);
      })
  );
});

test('negated hasFinalState fails with correct state with initial state', () => {
  const correctFinalState = {
    name: 'Tucker',
    age: 12,
  };

  return (
    expectSaga(saga)
      .withReducer(dogReducer, initialDog)
      // $FlowFixMe
      .not.hasFinalState(correctFinalState)
      .dispatch({ type: HAVE_BIRTHDAY })
      .run()
      .then(unreachableError)
      .catch(e => {
        expect(e.message).toMatch(/Expected to not have final store state/);
      })
  );
});
