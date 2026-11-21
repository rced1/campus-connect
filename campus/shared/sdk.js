/**
 * Browser Sharetribe SDK + public config bootstrap.
 * Mock api.js still owns data in M1; this exposes window.ccSdk for console checks
 * (e.g. ccSdk.marketplace.show()) and later milestones.
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
    sdk = window.sharetribeSdk.createInstance({
      clientId,
      // Cookie token store is the SDK default in the browser.
    });
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

  // Kick off as soon as this script loads (HTML includes the vendor bundle first).
  const ready = init();

  return {
    ready,
    get: () => sdk,
    getConfig: () => config,
    marketplace: {
      show: (...args) => {
        if (!sdk) throw new Error('SDK not ready yet. await ccSdk.ready first.');
        return sdk.marketplace.show(...args);
      },
    },
  };
})();
