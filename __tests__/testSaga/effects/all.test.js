// @flow
import { all, call, put } from 'redux-saga/effects';
import { testSaga } from '../../../src';
import identity from '../../../src/utils/identity';

describe('with `all`', () => {
  function* mainSaga() {
    yield all([
      call(identity),
      put({ type: 'FOO' }),
    ]);
  }

  it('handles all', () => {
    testSaga(mainSaga)
      .next()
      .all([
        call(identity),
        put({ type: 'FOO' }),
      ]);
  });

  it('throws if call wrong', () => {
    expect(_ => {
      testSaga(mainSaga)
        .next()
        .all([
          call(() => {}),
          put({ type: 'FOO' }),
        ]);
    }).toThrow();
  });

  it('throws if put wrong', () => {
    expect(_ => {
      testSaga(mainSaga)
        .next()
        .all([
          call(identity),
          put({ type: 'BAR' }),
        ]);
    }).toThrow();
  });
});

describe('with array', () => {
  function* mainSaga() {
    yield [
      call(identity),
      put({ type: 'FOO' }),
    ];
  }

  it('handles all', () => {
    testSaga(mainSaga)
      .next()
      .all([
        call(identity),
        put({ type: 'FOO' }),
      ]);
  });

  it('throws if call wrong', () => {
    expect(_ => {
      testSaga(mainSaga)
        .next()
        .all([
          call(() => {}),
          put({ type: 'FOO' }),
        ]);
    }).toThrow();
  });

  it('throws if put wrong', () => {
    expect(_ => {
      testSaga(mainSaga)
        .next()
        .all([
          call(identity),
          put({ type: 'BAR' }),
        ]);
    }).toThrow();
  });
});
