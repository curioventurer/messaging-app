export function memoize(func) {
  const cache = new Map(); // Use a Map to store cached results

  return function (...args) {
    const key = JSON.stringify(args); // Create a unique key based on function arguments

    if (cache.has(key)) {
      // If the result is cached, return it
      return cache.get(key);
    } else {
      // Otherwise, compute the result and cache it
      const result = func(...args);
      cache.set(key, result);
      return result;
    }
  };
}
