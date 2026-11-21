/**
 * Shared Integration SDK instance (one per process).
 * // CC: new file
 */

const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

let instance = null;

const getIntegrationSdk = () => {
  if (instance) {
    return instance;
  }
  const clientId = process.env.SHARETRIBE_INTEGRATION_CLIENT_ID;
  const clientSecret = process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SHARETRIBE_INTEGRATION_CLIENT_ID/SECRET are required for the worker.');
  }
  instance = sharetribeIntegrationSdk.createInstance({ clientId, clientSecret });
  return instance;
};

module.exports = {
  getIntegrationSdk,
};
