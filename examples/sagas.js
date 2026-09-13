'use strict';

const { call, delay, put, select, take } = require('redux-saga/effects');

/*
 * Shared sagas used by every framework example under `examples/<framework>/`.
 * The behaviour is intentionally small but exercises the most common
 * redux-saga effects (_take_, _select_, _call_, _put_) so that each example
 * can assert the full lifecycle of a saga.
 *
 * `loadItem` waits for a `LOAD_ITEM` action, sleeps a little, reads the item id
 * from the state slice, fetches the item through the fake `api`, and finally
 * puts the fetched item into the store.
 */
const api = {
  fetchItem(id) {
    return Promise.resolve({ id, name: `Item ${id}` });
  },
};

const getItemId = (state, action) => action.payload.id;

function* loadItem() {
  const action = yield take('LOAD_ITEM');
  yield delay(1);
  const id = yield select(getItemId, action);
  const item = yield call(api.fetchItem, id);
  yield put({ type: 'ITEM_LOADED', payload: item });
}

/*
 * Same saga, but used by the examples that demonstrate `matchers` + `provide`:
 * the `api.fetchItem` call is stubbed so the saga never hits the network and
 * the assertion can check the stubbed payload.
 */
function* loadItemStubbed() {
  const action = yield take('LOAD_ITEM');
  yield delay(1);
  const id = yield select(getItemId, action);
  const item = yield call(api.fetchItem, id);
  yield put({ type: 'ITEM_LOADED', payload: item, stubbed: true });
}

module.exports = { api, getItemId, loadItem, loadItemStubbed };