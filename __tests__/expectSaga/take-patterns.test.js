import { call, put, take } from 'redux-saga/effects';
import expectSaga from 'expectSaga';

const FOO_SYMBOL = Symbol('Foo');

const actionCreatorWithToString = payload => ({
  type: 'TO_STRING_ACTION',
  payload,
});
actionCreatorWithToString.toString = () => 'TO_STRING_ACTION';

function* sagaTakeArray() {
  const action = yield take(['FOO', 'BAR']);
  yield put({ type: 'DONE', payload: action.payload });
}

function* sagaTakeFunction() {
  const action = yield take(a => a.type === 'BAR');
  yield put({ type: 'DONE', payload: action.payload });
}

function* sagaTakeWildcard() {
  const action = yield take('*');
  yield put({ type: 'DONE', payload: action.payload });
}

function* sagaTakeStringType() {
  const action = yield take('BAR');
  yield put({ type: 'DONE', payload: action.payload });
}

function* sagaTakeActionCreatorWithToString(fn) {
  while (true) {
    const action = yield take(actionCreatorWithToString);
    yield call(fn);
    yield put({ type: 'ACTION', payload: action.payload });
  }
}

function* sagaTakeSymbolType() {
  const action = yield take(FOO_SYMBOL);
  yield put({ type: 'DONE', payload: action.payload });
}

function* sagaTakeArrayMix() {
  const action = yield take(['FOO', a => a.type === 'BAR']);

  yield put({ type: 'DONE', payload: action.payload });
}

test('takes action types in an array', () =>
  expectSaga(sagaTakeArray)
    .put({ type: 'DONE', payload: 'foo payload' })
    .dispatch({ type: 'FOO', payload: 'foo payload' })
    .run());

test('does not take array if correct action type not dispatched', () =>
  expectSaga(sagaTakeArray)
    .not.put.actionType('DONE')
    .dispatch({ type: 'BAZ', payload: 'baz payload' })
    .run({ silenceTimeout: true }));

test('takes functions', () =>
  expectSaga(sagaTakeFunction)
    .put({ type: 'DONE', payload: 'bar payload' })
    .dispatch({ type: 'BAR', payload: 'bar payload' })
    .run());

test('does not take function if wrong action dispatched', () =>
  expectSaga(sagaTakeFunction)
    .not.put.actionType('DONE')
    .dispatch({ type: 'BAZ', payload: 'baz payload' })
    .run({ silenceTimeout: true }));

test('takes wildcard if any action dispatched', () =>
  expectSaga(sagaTakeWildcard)
    .put({ type: 'DONE', payload: 'foo payload' })
    .dispatch({ type: 'FOO', payload: 'foo payload' })
    .run({ silenceTimeout: true }));

test('takes string type', () =>
  expectSaga(sagaTakeStringType)
    .put({ type: 'DONE', payload: 'bar payload' })
    .dispatch({ type: 'BAR', payload: 'bar payload' })
    .run());

test('takes action creators with toString defined', async () => {
  const spy = jest.fn();

  await expectSaga(sagaTakeActionCreatorWithToString, spy)
    .dispatch(actionCreatorWithToString(42))
    .dispatch({ type: 'IGNORED' })
    .dispatch(actionCreatorWithToString(42))
    .silentRun(10);

  expect(spy).toHaveBeenCalledTimes(2);
});

test('does not take string type if correct action type not dispatched', () =>
  expectSaga(sagaTakeStringType)
    .not.put.actionType('DONE')
    .dispatch({ type: 'BAZ', payload: 'baz payload' })
    .run({ silenceTimeout: true }));

test('takes symbol type', () =>
  expectSaga(sagaTakeSymbolType)
    .put({ type: 'DONE', payload: 'foo payload' })
    .dispatch({ type: FOO_SYMBOL, payload: 'foo payload' })
    .run());

test('does not take symbol type if correct action type not dispatched', () =>
  expectSaga(sagaTakeSymbolType)
    .not.put.actionType('DONE')
    .dispatch({ type: Symbol('Foo'), payload: 'foo payload' })
    .run({ silenceTimeout: true }));

test('takes mixed array', () =>
  Promise.all([
    expectSaga(sagaTakeArrayMix)
      .put({ type: 'DONE', payload: 'foo payload' })
      .dispatch({ type: 'FOO', payload: 'foo payload' })
      .run(),

    expectSaga(sagaTakeArrayMix)
      .put({ type: 'DONE', payload: 'bar payload' })
      .dispatch({ type: 'BAR', payload: 'bar payload' })
      .run(),
  ]));

test('does not take mixed array if correct action', () =>
  expectSaga(sagaTakeArrayMix)
    .not.put.actionType('DONE')
    .dispatch({ type: 'BAZ', payload: 'baz payload' })
    .run({ silenceTimeout: true }));
