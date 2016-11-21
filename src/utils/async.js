const setImmediate = (glob => (
  glob.setImmediate || ((fn, ...args) => glob.setTimeout(fn, 0, ...args))
))(typeof window !== 'undefined' ? window : global);

export function schedule(fn, args) {
  return new Promise((resolve) => {
    setImmediate(() => {
      const result = fn(...args);
      resolve(result);
    });
  });
}

export function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
