/**
 * Browser Sharetribe SDK + public config bootstrap.
 * // CC: M3 — auth helpers + error mapping for api.js
 */
const ccSdk = (() => {
  let sdk = null;
  let config = null;

  async function loadConfig() {
    const res = await fetch('/api/cc/config', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Could not load marketplace config.');
    const body = await res.json();
    config = body.data || body;
    if (typeof applyFlags === 'function') applyFlags(config.flags);
    return config;
  }

  function createSdk(clientId) {
    if (!window.sharetribeSdk) {
      console.warn('Sharetribe SDK bundle missing. Run yarn build-campus.');
      return null;
    }
    sdk = window.sharetribeSdk.createInstance({ clientId });
    return sdk;
  }

  async function init() {
    try {
      const cfg = await loadConfig();
      if (cfg.clientId) createSdk(cfg.clientId);
    } catch (err) {
      console.warn('Campus Connect SDK init:', err.message || err);
    }
    return sdk;
  }

  const ready = init();

  function mapError(err) {
    const status = err?.status || err?.data?.status;
    const message = err?.data?.errors?.[0]?.title || err?.message || 'Something went wrong.';
    if (status === 401) {
      const e = new Error('Please sign in to continue.');
      e.code = 'unauthorized';
      throw e;
    }
    if (status === 403) {
      const e = new Error('Your account is waiting for approval.');
      e.code = 'pending';
      throw e;
    }
    if (status === 409) {
      throw new Error('That one just sold out or that time was just taken. Pick another.');
    }
    if (status === 429) {
      throw new Error('Busy right now, try again.');
    }
    if (!navigator.onLine) {
      throw new Error("You're offline.");
    }
    throw new Error(message);
  }

  async function call(fn) {
    await ready;
    if (!sdk) throw new Error('Marketplace connection is not ready yet.');
    try {
      return await fn(sdk);
    } catch (err) {
      mapError(err);
    }
  }

  return {
    ready,
    get: () => sdk,
    getConfig: () => config,
    call,
    marketplace: {
      show: (...args) => call(s => s.marketplace.show(...args)),
    },
  };
})();
