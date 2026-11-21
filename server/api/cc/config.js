/**
 * GET /api/cc/config — public browser bootstrap config (no secrets).
 * // CC: new file
 */

module.exports = (req, res) => {
  const flags = {
    chores: false,
    ticketBoard: false,
    quickSell: false,
    googleCalendar: false,
    premiumSeller: false,
    reschedule: false,
    withdraw: false,
  };

  res.set('Cache-Control', 'public, max-age=60');
  res.status(200).json({
    data: {
      clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID || '',
      marketplaceRootURL: process.env.REACT_APP_MARKETPLACE_ROOT_URL || '',
      marketplaceName: process.env.REACT_APP_MARKETPLACE_NAME || 'Campus Connect',
      stripePublishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '',
      flags,
    },
  });
};
