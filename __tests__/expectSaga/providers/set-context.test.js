// @flow
import { setContext } from 'redux-saga/effects';
import expectSaga from 'expectSaga';

function* saga() {
  yield setContext({ answer: 42 });
}

test('dynamic values have access to effect', () =>
  expectSaga(saga)
    .provide({
      setContext(properties, next) {
        expect(properties.answer).toBe(42);
        return next();
      },
    })
    .run());
