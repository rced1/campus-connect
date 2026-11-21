/**
 * Allow-list for privileged initiate/transition calls (Campus Connect + template defaults).
 * // CC: new file
 */

// Stock template + CC payment initiates
const INITIATE_ALLOWED = new Set([
  'transition/request-payment',
  'transition/request-payment-after-inquiry',
  // default-negotiation (keep React fallbacks working)
  'transition/make-offer',
  'transition/make-offer-after-inquiry',
  'transition/make-offer-from-request',
  'transition/customer-make-counter-offer',
  'transition/provider-make-counter-offer',
  'transition/request-payment-to-accept-offer',
]);

const TRANSITION_ALLOWED = new Set([
  ...INITIATE_ALLOWED,
  // CC-specific privileged transitions
  'transition/confirm-payment-instant',
  'transition/complete-pickup',
  // negotiation privileged transitions
  'transition/customer-withdraw-counter-offer',
  'transition/provider-reject-counter-offer',
]);

/**
 * Listing types that may use confirm-payment-instant.
 */
const isInstantEligibleListing = listing => {
  const pd = listing?.attributes?.publicData || {};
  const listingType = pd.listingType;
  if (listingType === 'ticket') {
    return true;
  }
  if (listingType === 'service' && pd.instantBook === true) {
    return true;
  }
  return false;
};

/**
 * @param {string} transition
 * @param {'initiate'|'transition'} kind
 * @param {{ listing?: object, fromScan?: boolean }} [ctx]
 * @returns {{ ok: boolean, message?: string }}
 */
const assertPrivilegedAllowed = (transition, kind, ctx = {}) => {
  const allowed = kind === 'initiate' ? INITIATE_ALLOWED : TRANSITION_ALLOWED;
  if (!allowed.has(transition)) {
    return {
      ok: false,
      message: 'That payment step is not allowed.',
    };
  }

  if (transition === 'transition/confirm-payment-instant') {
    if (!isInstantEligibleListing(ctx.listing)) {
      return {
        ok: false,
        message: 'Instant confirmation is only for tickets or instant-book services.',
      };
    }
  }

  if (transition === 'transition/complete-pickup') {
    if (!ctx.fromScan) {
      return {
        ok: false,
        message: 'Pickup completion is only allowed via the scanner.',
      };
    }
  }

  return { ok: true };
};

module.exports = {
  INITIATE_ALLOWED,
  TRANSITION_ALLOWED,
  isInstantEligibleListing,
  assertPrivilegedAllowed,
};
