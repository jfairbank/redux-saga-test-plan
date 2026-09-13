'use strict';

/*
 * tape example. Run with:
 *
 *   npm install --save-dev tape
 *   tape examples/tape/loadItem.test.js
 */

const test = require('tape');

const { expectSaga, matchers, testSaga } = require('../../lib');

const { api, getItemId, loadItem, loadItemStubbed } = require('../sagas');

test('loadItem saga (tape): runs end to end and puts the fetched item', async t => {
  t.plan(1);

  await expectSaga(loadItem)
    .withState({})
    .dispatch({ type: 'LOAD_ITEM', payload: { id: 7 } })
    .call.like({ fn: api.fetchItem, args: [7] })
    .put({ type: 'ITEM_LOADED', payload: { id: 7, name: 'Item 7' } })
    .returns(undefined)
    .run();

  t.pass('saga finished without assertion failures');
});

test('loadItem saga (tape): can stub the api call with matchers + provide', async t => {
  t.plan(1);

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

  t.pass('provided call produced the stubbed payload');
});

test('loadItem saga (tape): drives the saga step by step with testSaga', t => {
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

  t.pass('testSaga walked every step without errors');
  t.end();
});