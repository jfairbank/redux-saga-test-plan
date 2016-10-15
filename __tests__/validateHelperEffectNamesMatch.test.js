// @flow
import { takeEvery, takeLatest } from 'redux-saga';
import validateHelperEffectNamesMatch from '../src/validateHelperEffectNamesMatch';

function* backgroundSaga() {
  yield 42;
}

test('returns null if generator does not have a name', () => {
  const actualIterator = takeEvery('FOO', backgroundSaga);

  delete actualIterator.name;

  const result = validateHelperEffectNamesMatch('takeEvery', actualIterator, 1);

  expect(result).toBe(null);
});

test('returns null if the names match', () => {
  const actualIterator = takeEvery('FOO', backgroundSaga);
  const result = validateHelperEffectNamesMatch('takeEvery', actualIterator, 1);

  expect(result).toBe(null);
});

test('returns error message if names do not match', () => {
  const actualIterator = takeLatest('FOO', backgroundSaga);
  const result = validateHelperEffectNamesMatch('takeEvery', actualIterator, 1);

  const regex = new RegExp(
    'expected a takeEvery helper effect, but the saga ' +
    'used a takeLatest helper effect'
  );

  expect(result).toMatch(regex);
});
