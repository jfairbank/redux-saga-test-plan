// @flow
import { call, put, select } from 'redux-saga/effects';
import { composeProviders, expectSaga, matchers as m } from '../../../src';

const findUser = () => null;
const findDog = () => null;
const findGreeting = () => 'hello';
const getOtherData = () => null;

const fakeUser = { name: 'John Doe' };
const fakeDog = { name: 'Tucker' };
const fakeOtherData = { foo: 'bar' };

const provideUser = ({ fn, args: [id] }, next) => (
  fn === findUser && id === 1 ? fakeUser : next()
);

const provideDog = ({ fn }, next) => (
  fn === findDog ? fakeDog : next()
);

const provideOtherData = ({ selector }, next) => (
  selector === getOtherData ? fakeOtherData : next()
);

function* saga() {
  const user = yield call(findUser, 1);
  const dog = yield call(findDog);
  const greeting = yield call(findGreeting);
  const otherData = yield select(getOtherData);

  yield put({
    type: 'DONE',
    payload: { user, dog, greeting, otherData },
  });
}

function* parallelSaga() {
  const [user, dog, greeting, otherData] = yield [
    call(findUser, 1),
    call(findDog),
    call(findGreeting),
    select(getOtherData),
  ];

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

      select: provideOtherData,
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
      { call: provideUser, select: provideOtherData },
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

test('takes static providers from redux-saga/effects or matchers', () => (
  expectSaga(saga)
    .provide([
      [call(findUser, 1), fakeUser],
      [m.call.fn(findDog), fakeDog],
      [m.select(getOtherData), fakeOtherData],
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

test('takes static and dynamics providers', () => (
  expectSaga(saga)
    .provide([
      [call(findUser, 1), fakeUser],
      { call: provideDog },
      [m.select(getOtherData), fakeOtherData],
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

test('provides for effects yielded in parallel', () => (
  expectSaga(parallelSaga)
    .provide([
      [call(findUser, 1), fakeUser],
      { call: provideDog },
      [m.select(getOtherData), fakeOtherData],
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
