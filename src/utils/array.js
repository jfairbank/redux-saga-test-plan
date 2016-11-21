/* eslint-disable import/prefer-default-export */

export const findIndex = [].findIndex ?
  function findIndex(array, fn) {
    return array.findIndex(fn);
  } :

  function findIndex(array, fn) {
    for (let i = 0, l = array.length; i < l; i++) {
      if (fn(array[i])) {
        return i;
      }
    }

    return -1;
  };
