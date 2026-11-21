/**
 * Campus Connect events worker.
 * M3: auto-approve verified @sdsu.edu users; more handlers in later milestones.
 *
 * Run: node server/cc/worker.js
 * // CC: new file
 */

require('../env').configureEnv();

const log = require('../log');
const { getRedis, pingRedis, getRedisUrl } = require('./redis');
const { getIntegrationSdk } = require('./integrationSdk');

const CURSOR_KEY = 'cc:events:cursor';
const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'sdsu.edu')
  .split(',')
  .map(d => d.trim().toLowerCase())
  .filter(Boolean);

const sleep = ms => new Promise(r => setTimeout(r, ms));

const emailDomain = email => {
  if (!email || !email.includes('@')) return '';
  return email.split('@').pop().toLowerCase();
};

const isAllowedEmail = email => ALLOWED_DOMAINS.includes(emailDomain(email));

/**
 * Approve pending users with verified emails on an allowed domain.
 * Idempotent: approve on already-active users is a no-op / safe to ignore.
 */
const maybeApproveUser = async (integrationSdk, user) => {
  if (!user) return;
  const attrs = user.attributes || {};
  const email = attrs.email;
  const emailVerified = attrs.emailVerified;
  const state = attrs.state;
  if (!emailVerified || !isAllowedEmail(email)) {
    return;
  }
  if (state && state !== 'pendingApproval' && state !== 'active') {
    return;
  }

  if (state === 'pendingApproval') {
    await integrationSdk.users.approve({ id: user.id }, { expand: true });
    // eslint-disable-next-line no-console
    console.log(`[cc-worker] approved ${email}`);
  }

  // Set metadata.verified (Integration updateProfile)
  try {
    await integrationSdk.users.updateProfile({
      id: user.id,
      metadata: { verified: true },
    });
  } catch (e) {
    log.error(e, 'cc-worker-verified-metadata');
  }
};

const handleEvent = async (integrationSdk, event) => {
  const type = event.attributes?.eventType || event.attributes?.type;
  if (type !== 'user/created' && type !== 'user/updated') {
    return;
  }
  const user = event.attributes?.resource;
  await maybeApproveUser(integrationSdk, user);
};

const loadCursor = async redis => {
  if (!redis) return null;
  try {
    const value = await redis.get(CURSOR_KEY);
    return value ? Number(value) : null;
  } catch (e) {
    return null;
  }
};

const saveCursor = async (redis, sequenceId) => {
  if (!redis || sequenceId == null) return;
  try {
    await redis.set(CURSOR_KEY, String(sequenceId));
  } catch (e) {
    log.error(e, 'cc-worker-cursor-save');
  }
};

const pollOnce = async (integrationSdk, redis, cursor) => {
  const query = {
    eventTypes: 'user/created,user/updated',
  };
  if (cursor != null) {
    query.startAfterSequenceId = cursor;
  } else {
    query.createdAtStart = new Date();
  }

  const res = await integrationSdk.events.query(query);
  const events = res.data.data || [];
  let last = cursor;
  for (const event of events) {
    await handleEvent(integrationSdk, event);
    last = event.attributes.sequenceId;
  }
  if (events.length && last != null) {
    await saveCursor(redis, last);
  }
  return { last, count: events.length };
};

const start = async () => {
  const url = getRedisUrl();
  // eslint-disable-next-line no-console
  console.log(`[cc-worker] starting (REDIS_URL ${url ? 'set' : 'missing'})`);
  const ok = await pingRedis();
  // eslint-disable-next-line no-console
  console.log(`[cc-worker] redis ${ok ? 'ok' : 'unavailable'}`);

  const integrationSdk = getIntegrationSdk();
  const redis = getRedis();
  let cursor = await loadCursor(redis);
  // eslint-disable-next-line no-console
  console.log(`[cc-worker] cursor ${cursor == null ? 'now' : cursor}`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const { count, last } = await pollOnce(integrationSdk, redis, cursor);
      if (last != null) cursor = last;
      await sleep(count > 0 ? 5000 : 30000);
    } catch (e) {
      log.error(e, 'cc-worker-poll');
      await sleep(15000);
    }
  }
};

start().catch(err => {
  log.error(err, 'cc-worker-boot');
  process.exit(1);
});
