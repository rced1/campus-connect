/**
 * Feature flags for Out-of-scope prototype surfaces. Default off.
 * Overridden at runtime by GET /api/cc/config when available.
 */
const CC_FLAGS = {
  chores: false,
  ticketBoard: false,
  quickSell: false,
  googleCalendar: false,
  premiumSeller: false,
  reschedule: false,
  withdraw: false,
};

function isFlagOn(name) {
  return Boolean(CC_FLAGS[name]);
}

function applyFlags(flags) {
  if (!flags || typeof flags !== 'object') return;
  Object.keys(CC_FLAGS).forEach((key) => {
    if (key in flags) CC_FLAGS[key] = Boolean(flags[key]);
  });
}
