'use strict';

/*
 * Scoped Jest config for the example test only. It intentionally filters to
 * `examples/jest` so the main suite (__tests__) keeps its own regex config.
 * Run from the repository root:
 *
 *   jest --config=examples/jest/jest.config.js --runInBand
 */
module.exports = {
  testEnvironment: 'node',
  collectCoverage: false,
  testRegex: 'examples/jest/.*\\.test\\.js$',
  roots: ['<rootDir>'],
};