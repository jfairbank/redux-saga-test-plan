import { Record, List, Map } from 'immutable';

import isEqual from '../../src/utils/isEqual';

class Cake extends new Record({
  name: '',
  ingredients: List(),
}) {}

const plainVanilaCake = { type: 'ACTION_TYPE', payload: [{ name: 'Vanila', ingredients: ['Vanila'] }] };
const plainSameVanilaCake = { payload: [{ ingredients: ['Vanila'], name: 'Vanila' }], type: 'ACTION_TYPE' };
const plainOtherCake = { type: 'ACTION_TYPE', payload: [{ name: 'Supper Vanila', ingredients: ['Valina', 'Chocolate'] }] };

const mixImmutableVanilaCake = { type: 'ACTION_TYPE', payload: List([new Cake({ name: 'Vanila', ingredients: List(['Vanila']) })]) };
const mixImmutableSameVanilaCake = { payload: List([new Cake({ ingredients: List(['Vanila']), name: 'Vanila' })]), type: 'ACTION_TYPE' }; // Needed in a different order, but same fields/values.
const mixImmutableOtherCake = { type: 'ACTION_TYPE', payload: List([new Cake({ name: 'Supper Vanila', ingredients: List(['Valina', 'Chocolate']) })]) };

const fullImmutableVanilaCake = Map({ type: 'ACTION_TYPE', payload: List([new Cake({ name: 'Vanila', ingredients: List(['Vanila']) })]) });
const fullImmutableSameVanilaCake = Map({ payload: List([new Cake({ ingredients: List(['Vanila']), name: 'Vanila' })]), type: 'ACTION_TYPE' }); // Needed in a different order, but same fields/values.
const fullImmutableOtherCake = Map({ type: 'ACTION_TYPE', payload: List([new Cake({ name: 'Supper Vanila', ingredients: List(['Valina', 'Chocolate']) })]) });

describe('simple equality', () => {
  test('equals', () => expect(isEqual(1, 1)).toBe(true));
  test('not equals', () => expect(isEqual(1, 2)).toBe(false));
});


describe('plain object equality', () => {
  test('equals', () => expect(isEqual(plainVanilaCake, plainSameVanilaCake)).toBe(true));
  test('not equals', () => expect(isEqual(plainVanilaCake, plainOtherCake)).toBe(false));
});

describe('mixImmutable object equality', () => {
  test('equals', () => expect(isEqual(mixImmutableVanilaCake, mixImmutableSameVanilaCake)).toBe(true));
  test('not equals', () => expect(isEqual(mixImmutableVanilaCake, mixImmutableOtherCake)).toBe(false));
});


describe('fullImmutable object equality', () => {
  test('equals', () => expect(isEqual(fullImmutableVanilaCake, fullImmutableSameVanilaCake)).toBe(true));
  test('not equals', () => expect(isEqual(fullImmutableVanilaCake, fullImmutableOtherCake)).toBe(false));
});
