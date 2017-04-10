// @flow
import { call, put } from 'redux-saga/effects';
import { composeProviders, expectSaga } from '../../../src';

const findUser = () => null;
const findDog = () => null;
const findGreeting = () => 'hello';

const provideUser = user => ({ fn }, next) => (
  fn === findUser ? user : next()
);

const provideDog = dog => ({ fn }, next) => (
  fn === findDog ? dog : next()
);

test('composes multiple providers', () => {
  const fakeUser = { name: 'John Doe' };
  const fakeDog = { name: 'Tucker' };

  function* saga() {
    const user = yield call(findUser);
    const dog = yield call(findDog);
    const greeting = yield call(findGreeting);

    yield put({
      type: 'DONE',
      payload: { user, dog, greeting },
    });
  }

  return expectSaga(saga)
    .provide({
      call: composeProviders(
        provideUser(fakeUser),
        provideDog(fakeDog),
      ),
    })
    .put({
      type: 'DONE',
      payload: {
        user: fakeUser,
        dog: fakeDog,
        greeting: 'hello',
      },
    })
    .run();
});
