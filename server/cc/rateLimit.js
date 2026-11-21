/**
 * Fixed-window rate limiter (Redis), with in-memory fallback.
 * // CC: new file
 */

const { getRedis } = require('./redis');

const localWindows = new Map();

const localLimit = (bucket, limit, windowSeconds) => {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let entry = localWindows.get(bucket);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    localWindows.set(bucket, entry);
  }
  entry.count += 1;
  return entry.count <= limit;
};

/**
 * @param {string} key user id or IP
 * @param {number} limit
 * @param {number} windowSeconds
 * @returns {Promise<boolean>} true if allowed
 */
const allow = async (key, limit, windowSeconds = 60) => {
  const bucket = `cc:rl:${key}:${windowSeconds}`;
  const redis = getRedis();
  if (!redis) {
    return localLimit(bucket, limit, windowSeconds);
  }
  try {
    const count = await redis.incr(bucket);
    if (count === 1) {
      await redis.expire(bucket, windowSeconds);
    }
    return count <= limit;
  } catch (e) {
    return localLimit(bucket, limit, windowSeconds);
  }
};

/**
 * Express middleware: 120 req/min per user or IP across /api/cc/*.
 */
const ccApiLimiter = async (req, res, next) => {
  const id = req.ccUserId || req.ip || 'anon';
  const ok = await allow(id, 120, 60);
  if (!ok) {
    return res.status(429).json({
      error: { code: 'rate_limited', message: 'Busy right now, try again in a minute.' },
    });
  }
  return next();
};

module.exports = {
  allow,
  ccApiLimiter,
};
