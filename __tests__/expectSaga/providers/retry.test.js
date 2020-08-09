// @flow
import { call, put, take, retry } from 'redux-saga/effects';
import expectSaga from 'expectSaga';

jest.mock('utils/logging');

test('provides values in `retry` function', () => {
  const fetchUser = () => 0;

  const fakeUser = {
    id: 1,
    name: 'John Doe',
  };

  function* fooSaga(arg1, arg2) {
    const user = yield call(fetchUser);

    yield put({
      type: 'RECEIVE_USER',
      payload: user,
      meta: { args: [arg1, arg2] },
    });
  }

  function* saga() {
    yield take('REQUEST_USER');
    yield retry(3, 500, fooSaga, 42, 'hello');
  }

  return expectSaga(saga)
    .provide({
      call({ fn }, next) {
        if (fn === fetchUser) {
          return fakeUser;
        }

        return next();
      },
    })
    .put({
      type: 'RECEIVE_USER',
      payload: fakeUser,
      meta: {
        args: [42, 'hello'],
      },
    })
    .dispatch({ type: 'REQUEST_USER' })
    .silentRun({ timeout: 2000 });
});

test('calls `fn` 3 times if it crashes and done', async () => {
  const fakeFetcher = jest.fn();

  fakeFetcher.mockImplementation(() => {
    throw new Error();
  });

  function* fooSaga() {
    yield call(fakeFetcher);
    yield put({ type: 'FINISH' });
  }

  function* saga() {
    yield take('START');
    try {
      yield retry(3, 500, fooSaga);
    } catch (e) {}
  }

  const result = await expectSaga(saga)
    .dispatch({ type: 'START' })
    .not.put({ type: 'FINISH' })
    .silentRun({ timeout: 2000 });

  expect(fakeFetcher).toHaveBeenCalledTimes(3);

  return result;
});

test('calls `fn` 2 times if it crashes and puts `FINISH` action', async () => {
  const fakeFetcher = jest.fn();

  let tries = 0;

  fakeFetcher.mockImplementation(() => {
    tries += 1;
    if (tries <= 2) {
      throw new Error();
    }
  });

  function* fooSaga() {
    yield call(fakeFetcher);
    yield put({ type: 'FINISH' });
  }

  function* saga() {
    yield take('START');
    try {
      yield retry(3, 500, fooSaga);
    } catch (e) {}
  }

  const result = await expectSaga(saga)
    .dispatch({ type: 'START' })
    .put({ type: 'FINISH' })
    .silentRun({ timeout: 2000 });

  expect(fakeFetcher).toHaveBeenCalledTimes(3);
  expect(tries).toBe(3);

  return result;
});
