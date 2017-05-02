import serializeTakePattern from 'testSaga/serializeTakePattern';

test('arrays', () => {
  expect(serializeTakePattern([])).toBe('[]');

  expect(
    serializeTakePattern(['FOO', 'BAR', 'BAZ']),
  ).toBe(
    '[FOO, BAR, BAZ]',
  );
});

test('functions', () => {
  expect(
    // eslint-disable-next-line prefer-arrow-callback
    serializeTakePattern(function foo() { return 42; }),
  ).toBe(
    '[Function: foo]',
  );

  expect(
    serializeTakePattern(() => 42),
  ).toBe(
    '[Function: <anonymous function>]',
  );
});

test('strings', () => {
  expect(serializeTakePattern('FOO')).toEqual('FOO');
});
