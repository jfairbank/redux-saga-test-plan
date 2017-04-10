// @flow
import { call, put, select } from 'redux-saga/effects';
import { composeProviders, expectSaga } from '../../../src';

const findUser = () => null;
const findDog = () => null;
const findGreeting = () => 'hello';
const getOtherData = () => null;

const fakeUser = { name: 'John Doe' };
const fakeDog = { name: 'Tucker' };
const fakeOtherData = { foo: 'bar' };

const provideUser = ({ fn }, next) => (
  fn === findUser ? fakeUser : next()
);

const provideDog = ({ fn }, next) => (
  fn === findDog ? fakeDog : next()
);

const providerOtherData = ({ selector }, next) => (
  selector === getOtherData ? fakeOtherData : next()
);

function* saga() {
  const user = yield call(findUser);
  const dog = yield call(findDog);
  const greeting = yield call(findGreeting);
  const otherData = yield select(getOtherData);

  yield put({
    type: 'DONE',
    payload: { user, dog, greeting, otherData },
  });
}

test('composes multiple providers', () => (
  expectSaga(saga)
    .provide({
      call: composeProviders(
        provideUser,
        provideDog,
      ),

      select: providerOtherData,
    })
    .put({
      type: 'DONE',
      payload: {
        user: fakeUser,
        dog: fakeDog,
        greeting: 'hello',
        otherData: fakeOtherData,
      },
    })
    .run()
));

test('takes multiple providers and composes them', () => (
  expectSaga(saga)
    .provide([
      { call: provideUser, select: providerOtherData },
      { call: provideDog },
    ])
    .put({
      type: 'DONE',
      payload: {
        user: fakeUser,
        dog: fakeDog,
        greeting: 'hello',
        otherData: fakeOtherData,
      },
    })
    .run()
));
