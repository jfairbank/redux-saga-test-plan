'use strict';

/*
 * Jest example. Run with:
 *
 *   npm install --save-dev jest
 *   jest examples/jest/loadItem.test.js
 *
 * or from the repository root (Jest is already a devDependency):
 *
 *   npm run build
 *   npx jest examples/jest/loadItem.test.js --runInBand --collectCoverage=false
 */

const { expectSaga, matchers, testSaga } = require('../../lib');

const { api, getItemId, loadItem, loadItemStubbed } = require('../sagas');

describe('loadItem saga (Jest)', () => {
  it('runs end to end and puts the fetched item', () =>
    expectSaga(loadItem)
      .withState({})
      .dispatch({ type: 'LOAD_ITEM', payload: { id: 7 } })
      .call.like({ fn: api.fetchItem, args: [7] })
      .put({ type: 'ITEM_LOADED', payload: { id: 7, name: 'Item 7' } })
      .returns(undefined)
      .run());

  it('can stub the api call with matchers + provide', () =>
    expectSaga(loadItemStubbed)
      .withState({})
      .dispatch({ type: 'LOAD_ITEM', payload: { id: 9 } })
      .provide([[matchers.call.fn(api.fetchItem), { id: 9, name: 'Stubbed' }]])
      .put({
        type: 'ITEM_LOADED',
        payload: { id: 9, name: 'Stubbed' },
        stubbed: true,
      })
      .run());

  it('drives the saga step by step with testSaga', () => {
    testSaga(loadItem)
      .next()
      .take('LOAD_ITEM')
      .next({ type: 'LOAD_ITEM', payload: { id: 3 } })
      .delay(1)
      .next()
      .select(getItemId, { type: 'LOAD_ITEM', payload: { id: 3 } })
      .next(3)
      .call(api.fetchItem, 3)
      .next({ id: 3, name: 'Item 3' })
      .put({ type: 'ITEM_LOADED', payload: { id: 3, name: 'Item 3' } })
      .next()
      .isDone();
  });
});