import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { put, select } from 'redux-saga/effects';
import { expectSaga } from '../../src';

const initialState = {
  dog: {
    name: 'Tucker',
    age: 11,
  },
};

function reducer(state = initialState) {
  return state;
}

function getDog(state) {
  return state.dog;
}

function* saga() {
  const dog = yield select(getDog);
  yield put({ type: 'DOG', payload: dog });
}

const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(saga);

it('works with redux stores', () => {
  const expect = expectSaga(saga).withStore(store);

  expect.put({ type: 'DOG', payload: initialState.dog });

  return expect.run();

  // expectSaga(saga)
  //   .withStore(store)
  //   .put({ type: 'DOG', payload: initialState.dog })
  //   .run();
});
