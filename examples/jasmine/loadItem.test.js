'use strict';

/*
 * Jasmine example. Run from the repository root with:
 *
 *   npm install --save-dev jasmine
 *   jasmine --config=examples/jasmine/jasmine.json
 *
 * The jasmine CLI registers `describe`, `it` and `expect` as globals and
 * passes failures through to the process exit code.
 */

const { expectSaga, matchers, testSaga } = require('../../lib');

const { api, getItemId, loadItem, loadItemStubbed } = require('../sagas');

describe('loadItem saga (Jasmine)', () => {
  it('runs end to end and puts the fetched item', async () => {
    await expectSaga(loadItem)
      .withState({})
      .dispatch({ type: 'LOAD_ITEM', payload: { id: 7 } })
      .call.like({ fn: api.fetchItem, args: [7] })
      .put({ type: 'ITEM_LOADED', payload: { id: 7, name: 'Item 7' } })
      .returns(undefined)
      .run();
  });

  it('can stub the api call with matchers + provide', async () => {
    await expectSaga(loadItemStubbed)
      .withState({})
      .dispatch({ type: 'LOAD_ITEM', payload: { id: 9 } })
      .provide([[matchers.call.fn(api.fetchItem), { id: 9, name: 'Stubbed' }]])
      .put({
        type: 'ITEM_LOADED',
        payload: { id: 9, name: 'Stubbed' },
        stubbed: true,
      })
      .run();
  });

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