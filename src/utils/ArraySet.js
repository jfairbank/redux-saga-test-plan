// @flow
/* eslint-disable no-underscore-dangle */
import isEqual from 'lodash.isequal';
import { findIndex } from './array';

export default class ArraySet<T> {
  _values: Array<T>;

  constructor(values?: Array<T> = []) {
    this._values = values.slice(0);
  }

  values(): Array<T> {
    return this._values.slice(0);
  }

  add(value: T): void {
    this._values.push(value);
  }

  has(value: T): boolean {
    const index = this.findIndex(value);
    return index !== -1;
  }

  delete(value: T): boolean {
    const index = this.findIndex(value);

    if (index !== -1) {
      this._values.splice(index, 1);
      return true;
    }

    return false;
  }

  findIndex(value: T): number {
    return findIndex(this._values, item => isEqual(item, value));
  }
}
