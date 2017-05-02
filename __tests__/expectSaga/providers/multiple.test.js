// @flow
import { call, put, select } from 'redux-saga/effects';
import expectSaga from 'expectSaga';
import * as m from 'expectSaga/matchers';
import { composeProviders, dynamic } from 'expectSaga/providers';

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

test('works with multiple dynamic providers', () => {
  const fn = a => a + 2;

  function* someSaga() {
    const x = yield call(fn, 4);
    const y = yield call(fn, 6);
    const z = yield call(fn, 8);

    yield put({ type: 'DONE', payload: x + y + z });
  }

  const provideDouble = ({ args: [a] }, next) => (
    a === 6 ? a * 2 : next()
  );

  const provideTriple = ({ args: [a] }, next) => (
    a > 4 ? a * 3 : next()
  );

  return expectSaga(someSaga)
    .provide([
      [m.call.fn(fn), dynamic(provideDouble)],
      [m.call.fn(fn), dynamic(provideTriple)],
    ])
    .put({ type: 'DONE', payload: 42 })
    .run();
});
