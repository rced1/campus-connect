/**
 * Campus Connect events worker entry point.
 * M1: process boots and pings Redis; event handlers arrive in M3+.
 *
 * Run: node server/cc/worker.js
 * // CC: new file
 */

require('../env').configureEnv();

const log = require('../log');
const { pingRedis, getRedisUrl } = require('./redis');

const start = async () => {
  const url = getRedisUrl();
  // eslint-disable-next-line no-console
  console.log(`[cc-worker] starting (REDIS_URL ${url ? 'set' : 'missing'})`);
  const ok = await pingRedis();
  // eslint-disable-next-line no-console
  console.log(`[cc-worker] redis ${ok ? 'ok' : 'unavailable'}`);
  if (!ok && url) {
    log.error(new Error('Redis unreachable'), 'cc-worker-redis');
  }
  // Keep process alive for ECS; polling loop lands in M3.
  setInterval(() => {}, 60 * 1000);
};

start().catch(err => {
  log.error(err, 'cc-worker-boot');
  process.exit(1);
});
