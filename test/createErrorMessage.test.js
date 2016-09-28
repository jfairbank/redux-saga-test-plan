// @flow
import test from 'ava';
import { put } from 'redux-saga/effects';
import createErrorMessage from '../src/createErrorMessage';
import serializeEffect from '../src/serializeEffect';

const header = 'hello world';
const stepNumber = 2;

test('includes the assertion number, header and serialized effects', t => {
  const donePut = put({ type: 'DONE' });
  const readyPut = put({ type: 'READY' });
  const effectKey = 'PUT';

  const result = createErrorMessage(header, stepNumber, donePut, readyPut, effectKey);

  const serializedDonePut = serializeEffect(donePut, effectKey);
  const serializedReadyPut = serializeEffect(readyPut, effectKey);

  const expected = `\nAssertion ${stepNumber} failed: ${header}\n\n`
                 + `Expected\n--------\n${serializedReadyPut}\n\n`
                 + `Actual\n------\n${serializedDonePut}\n`;

  t.is(result, expected);
});

test('includes the assertion number, header and serialized values', t => {
  const actual = 41;
  const expected = 42;

  const result = createErrorMessage(header, stepNumber, actual, expected);

  const serializedActual = serializeEffect(actual);
  const serializedExpected = serializeEffect(expected);

  const expectedTestResult = `\nAssertion ${stepNumber} failed: ${header}\n\n`
                           + `Expected\n--------\n${serializedExpected}\n\n`
                           + `Actual\n------\n${serializedActual}\n`;

  t.is(result, expectedTestResult);
});
