// @flow
import { put, select } from 'redux-saga/effects';
import { expectSaga } from '../../../src';

test('uses provided value for `select`', () => {
  const getValue = () => 0;
  const getOtherValue = state => state.otherValue;

  function* saga() {
    const value = yield select(getValue);
    const otherValue = yield select(getOtherValue);

    yield put({ type: 'DONE', payload: value + otherValue });
  }

  return expectSaga(saga)
    .withState({ otherValue: 22 })
    .provide({
      select({ selector }, next) {
        if (selector === getValue) {
          return 20;
        }

        return next();
      },
    })
    .put({ type: 'DONE', payload: 42 })
    .run();
});
