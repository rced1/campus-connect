/**
 * Shared Redis client for Campus Connect.
 * // CC: new file — used by cache, rate limits, SSE, and the events worker.
 */

const Redis = require('ioredis');
const log = require('../log');

let client = null;
let connectAttempted = false;

const getRedisUrl = () => process.env.REDIS_URL || null;

/**
 * Returns a shared ioredis client, or null when REDIS_URL is unset / unreachable setup.
 * Callers must tolerate null and fall back to in-memory behavior.
 */
const getRedis = () => {
  const url = getRedisUrl();
  if (!url) {
    return null;
  }
  if (client) {
    return client;
  }
  if (connectAttempted && !client) {
    return null;
  }
  connectAttempted = true;
  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    client.on('error', err => {
      log.error(err, 'cc-redis-error');
    });
    return client;
  } catch (e) {
    log.error(e, 'cc-redis-init-failed');
    client = null;
    return null;
  }
};

/**
 * Ping Redis. Resolves true when reachable.
 */
const pingRedis = async () => {
  const redis = getRedis();
  if (!redis) {
    return false;
  }
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (e) {
    return false;
  }
};

module.exports = {
  getRedis,
  pingRedis,
  getRedisUrl,
};
