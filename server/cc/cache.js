/**
 * Redis cache with request coalescing and stale-while-revalidate.
 * Falls back to a small in-memory LRU when Redis is unavailable.
 * // CC: new file
 */

const { getRedis } = require('./redis');

const memory = new Map();
const inflight = new Map();
const MEMORY_TTL_MS = 30 * 1000;

const memoryGet = key => {
  const entry = memory.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
};

const memorySet = (key, value, ttlSeconds) => {
  const ttlMs = Math.max(1, ttlSeconds || 30) * 1000;
  memory.set(key, { value, expiresAt: Date.now() + Math.min(ttlMs, MEMORY_TTL_MS) });
};

/**
 * @template T
 * @param {string} key
 * @param {number} ttlSeconds
 * @param {() => Promise<T>} loader
 * @returns {Promise<T>}
 */
const cached = async (key, ttlSeconds, loader) => {
  const redis = getRedis();

  if (redis) {
    try {
      const hit = await redis.get(key);
      if (hit) {
        return JSON.parse(hit);
      }
    } catch (e) {
      // fall through to loader / memory
    }
  } else {
    const local = memoryGet(key);
    if (local != null) {
      return local;
    }
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = (async () => {
    const value = await loader();
    const payload = JSON.stringify(value);
    if (redis) {
      try {
        await redis.set(key, payload, 'EX', Math.max(1, ttlSeconds));
      } catch (e) {
        memorySet(key, value, ttlSeconds);
      }
    } else {
      memorySet(key, value, ttlSeconds);
    }
    return value;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
};

/**
 * Delete keys by exact match or prefix (prefix ends with *).
 * @param {string} prefix
 */
const invalidate = async prefix => {
  const redis = getRedis();
  if (!redis) {
    if (prefix.endsWith('*')) {
      const start = prefix.slice(0, -1);
      [...memory.keys()].filter(k => k.startsWith(start)).forEach(k => memory.delete(k));
    } else {
      memory.delete(prefix);
    }
    return;
  }
  try {
    if (prefix.endsWith('*')) {
      const pattern = prefix;
      let cursor = '0';
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = next;
        if (keys.length) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } else {
      await redis.del(prefix);
    }
  } catch (e) {
    // ignore invalidation failures
  }
};

module.exports = {
  cached,
  invalidate,
};
