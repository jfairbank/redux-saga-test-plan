// @flow
import { getContext, put } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { dynamic } from 'expectSaga/providers';

const contextVar = 'contextValue';

function* saga() {
  const value = yield getContext(contextVar);

  yield put({ type: 'DONE', payload: value });
}

test('uses provided value for `getContext`', () =>
  expectSaga(saga)
    .provide({
      getContext(property, next) {
        if (property === contextVar) {
          return 42;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 42 })
    .run());

test('uses static provided values from redux-saga/effects', () =>
  expectSaga(saga)
    .provide([[getContext(contextVar), 42]])
    .put({ type: 'DONE', payload: 42 })
    .run());

test('uses static provided values from matchers', () =>
  expectSaga(saga)
    .provide([[m.getContext(contextVar), 42]])
    .put({ type: 'DONE', payload: 42 })
    .run());

test('dynamic values have access to effect', () =>
  expectSaga(saga)
    .provide([
      [
        m.getContext(contextVar),
        dynamic(property => {
          expect(property).toBe(contextVar);
          return 42;
        }),
      ],
    ])
    .put({ type: 'DONE', payload: 42 })
    .run());
