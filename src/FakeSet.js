/* eslint-disable no-underscore-dangle */
import isEqual from 'lodash.isequal';
import { findIndex } from './utils/array';

export default class FakeSet {
  constructor() {
    this._values = [];
  }

  get size() {
    return this._values.length;
  }

  values() {
    return this._values.slice();
  }

  add(value) {
    this._values.push(value);
  }

  has(value) {
    const index = this.findIndex(value);
    return index !== -1;
  }

  delete(value) {
    const index = this.findIndex(value);

    if (index !== -1) {
      this._values.splice(index, 1);
      return true;
    }

    return false;
  }

  findIndex(value) {
    return findIndex(this._values, item => isEqual(item, value));
  }
}
