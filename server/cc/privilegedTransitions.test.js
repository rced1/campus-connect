const {
  assertPrivilegedAllowed,
  isInstantEligibleListing,
} = require('./privilegedTransitions');

describe('privilegedTransitions', () => {
  test('allows request-payment on initiate', () => {
    expect(assertPrivilegedAllowed('transition/request-payment', 'initiate').ok).toBe(true);
  });

  test('rejects unknown transition', () => {
    expect(assertPrivilegedAllowed('transition/accept', 'transition').ok).toBe(false);
  });

  test('confirm-payment-instant requires ticket or instantBook service', () => {
    const denied = assertPrivilegedAllowed('transition/confirm-payment-instant', 'transition', {
      listing: { attributes: { publicData: { listingType: 'service', instantBook: false } } },
    });
    expect(denied.ok).toBe(false);

    const ticket = assertPrivilegedAllowed('transition/confirm-payment-instant', 'transition', {
      listing: { attributes: { publicData: { listingType: 'ticket' } } },
    });
    expect(ticket.ok).toBe(true);

    const instant = assertPrivilegedAllowed('transition/confirm-payment-instant', 'transition', {
      listing: { attributes: { publicData: { listingType: 'service', instantBook: true } } },
    });
    expect(instant.ok).toBe(true);
  });

  test('complete-pickup only from scan', () => {
    expect(
      assertPrivilegedAllowed('transition/complete-pickup', 'transition', { fromScan: false }).ok
    ).toBe(false);
    expect(
      assertPrivilegedAllowed('transition/complete-pickup', 'transition', { fromScan: true }).ok
    ).toBe(true);
  });

  test('isInstantEligibleListing', () => {
    expect(isInstantEligibleListing({ attributes: { publicData: { listingType: 'ticket' } } })).toBe(
      true
    );
    expect(
      isInstantEligibleListing({
        attributes: { publicData: { listingType: 'product' } },
      })
    ).toBe(false);
  });
});
