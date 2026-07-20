var Cache = (function () {
  function getCache() {
    return CacheService.getScriptCache();
  }

  function key(name) {
    return Constants.APP.CACHE_PREFIX + String(name);
  }

  function get(name, fallback) {
    var raw = getCache().get(key(name));

    if (raw === null) return fallback;

    return Utils.safeJsonParse(raw, fallback);
  }

  function put(name, value, expirationSeconds) {
    var ttl = Math.max(
      1,
      Math.min(Number(expirationSeconds) || 300, 21600)
    );

    getCache().put(key(name), Utils.safeJsonStringify(value), ttl);
    return value;
  }

  function remove(name) {
    getCache().remove(key(name));
  }

  function getOrSet(name, producer, expirationSeconds) {
    var cached = get(name, null);

    if (cached !== null) return cached;

    return put(name, producer(), expirationSeconds);
  }

  function clearAll() {
    remove('configuration');
    remove('bootstrap');
  }

  return Object.freeze({
    get: get,
    put: put,
    remove: remove,
    getOrSet: getOrSet,
    clearAll: clearAll
  });
})();