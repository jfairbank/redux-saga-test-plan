# State

If your saga uses the `select` effect, then you'll need some state to select
against. The `expectSaga` API includes the `withState` and `withReducer` methods
to manage store state in your tests.

For static state, you can just use the `withState` method as seen below:

```js
const storeState = {
  data: {
    foo: 'bar',
  },
};

function getData(state) {
  return state.data;
}

function* saga() {
  const data = yield select(getData);
  yield put({ type: 'DATA', payload: data });
}

it('can take store state', () => {
  return expectSaga(saga)
    .withState(storeState)
    .put({ type: 'DATA', payload: storeState.data })
    .run();
});
```

For state that might change, you can use the `withReducer` method. It takes two
arguments: your reducer and optional initial state. If you don't supply the
initial state, then `withReducer` will extract it by passing an initial action
into your reducer like Redux.

```js
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

it('handles reducers when not supplying initial state', () => {
  return expectSaga(saga)
    .withReducer(dogReducer)

    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 12 })

    .dispatch({ type: HAVE_BIRTHDAY })
    .run();
});

it('handles reducers when supplying initial state', () => {
  return expectSaga(saga)
    .withReducer(dogReducer, initialDog)

    .put({ type: AGE_BEFORE, payload: 11 })
    .put({ type: AGE_AFTER, payload: 12 })

    .dispatch({ type: HAVE_BIRTHDAY })
    .run();
});
```
