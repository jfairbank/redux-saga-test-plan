// @flow
export default (typeof Map !== 'undefined'
  ? Map
  : require('core-js/library/es6/map'));
