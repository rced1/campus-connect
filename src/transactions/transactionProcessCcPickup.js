/**
 * Transaction process graph for Campus Connect product pickup:
 *   - cc-pickup
 * // CC: new file
 */

import { PAYMENT_METHOD_CARD, stripePaymentMethodInfo } from './paymentMethods';

export const transitions = {
  REQUEST_PAYMENT: 'transition/request-payment',
  INQUIRE: 'transition/inquire',
  REQUEST_PAYMENT_AFTER_INQUIRY: 'transition/request-payment-after-inquiry',
  CONFIRM_PAYMENT: 'transition/confirm-payment',
  EXPIRE_PAYMENT: 'transition/expire-payment',
  ACCEPT: 'transition/accept',
  DECLINE: 'transition/decline',
  EXPIRE: 'transition/expire',
  MARK_READY: 'transition/mark-ready',
  COMPLETE_PICKUP: 'transition/complete-pickup',
  AUTO_COMPLETE: 'transition/auto-complete',
  PROVIDER_CANCEL_FROM_ACCEPTED: 'transition/provider-cancel-from-accepted',
  PROVIDER_CANCEL_FROM_READY: 'transition/provider-cancel-from-ready',
  REVIEW_1_BY_PROVIDER: 'transition/review-1-by-provider',
  REVIEW_2_BY_PROVIDER: 'transition/review-2-by-provider',
  REVIEW_1_BY_CUSTOMER: 'transition/review-1-by-customer',
  REVIEW_2_BY_CUSTOMER: 'transition/review-2-by-customer',
  EXPIRE_CUSTOMER_REVIEW_PERIOD: 'transition/expire-customer-review-period',
  EXPIRE_PROVIDER_REVIEW_PERIOD: 'transition/expire-provider-review-period',
  EXPIRE_REVIEW_PERIOD: 'transition/expire-review-period',
};

export const states = {
  INITIAL: 'initial',
  INQUIRY: 'inquiry',
  PENDING_PAYMENT: 'pending-payment',
  PAYMENT_EXPIRED: 'payment-expired',
  PREAUTHORIZED: 'preauthorized',
  DECLINED: 'declined',
  ACCEPTED: 'accepted',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REVIEWED: 'reviewed',
  REVIEWED_BY_CUSTOMER: 'reviewed-by-customer',
  REVIEWED_BY_PROVIDER: 'reviewed-by-provider',
};

export const graph = {
  id: 'cc-pickup/release-1',
  initial: states.INITIAL,
  states: {
    [states.INITIAL]: {
      on: {
        [transitions.INQUIRE]: states.INQUIRY,
        [transitions.REQUEST_PAYMENT]: states.PENDING_PAYMENT,
      },
    },
    [states.INQUIRY]: {
      on: {
        [transitions.REQUEST_PAYMENT_AFTER_INQUIRY]: states.PENDING_PAYMENT,
      },
    },
    [states.PENDING_PAYMENT]: {
      on: {
        [transitions.EXPIRE_PAYMENT]: states.PAYMENT_EXPIRED,
        [transitions.CONFIRM_PAYMENT]: states.PREAUTHORIZED,
      },
    },
    [states.PAYMENT_EXPIRED]: {},
    [states.PREAUTHORIZED]: {
      on: {
        [transitions.ACCEPT]: states.ACCEPTED,
        [transitions.DECLINE]: states.DECLINED,
        [transitions.EXPIRE]: states.DECLINED,
      },
    },
    [states.DECLINED]: {},
    [states.ACCEPTED]: {
      on: {
        [transitions.MARK_READY]: states.READY,
        [transitions.PROVIDER_CANCEL_FROM_ACCEPTED]: states.CANCELLED,
      },
    },
    [states.READY]: {
      on: {
        [transitions.COMPLETE_PICKUP]: states.COMPLETED,
        [transitions.AUTO_COMPLETE]: states.COMPLETED,
        [transitions.PROVIDER_CANCEL_FROM_READY]: states.CANCELLED,
      },
    },
    [states.CANCELLED]: {},
    [states.COMPLETED]: {
      on: {
        [transitions.EXPIRE_REVIEW_PERIOD]: states.REVIEWED,
        [transitions.REVIEW_1_BY_CUSTOMER]: states.REVIEWED_BY_CUSTOMER,
        [transitions.REVIEW_1_BY_PROVIDER]: states.REVIEWED_BY_PROVIDER,
      },
    },
    [states.REVIEWED_BY_CUSTOMER]: {
      on: {
        [transitions.REVIEW_2_BY_PROVIDER]: states.REVIEWED,
        [transitions.EXPIRE_PROVIDER_REVIEW_PERIOD]: states.REVIEWED,
      },
    },
    [states.REVIEWED_BY_PROVIDER]: {
      on: {
        [transitions.REVIEW_2_BY_CUSTOMER]: states.REVIEWED,
        [transitions.EXPIRE_CUSTOMER_REVIEW_PERIOD]: states.REVIEWED,
      },
    },
    [states.REVIEWED]: { type: 'final' },
  },
};

export const isRelevantPastTransition = transition => {
  return [
    transitions.CONFIRM_PAYMENT,
    transitions.ACCEPT,
    transitions.DECLINE,
    transitions.EXPIRE,
    transitions.MARK_READY,
    transitions.COMPLETE_PICKUP,
    transitions.AUTO_COMPLETE,
    transitions.PROVIDER_CANCEL_FROM_ACCEPTED,
    transitions.PROVIDER_CANCEL_FROM_READY,
    transitions.REVIEW_1_BY_CUSTOMER,
    transitions.REVIEW_1_BY_PROVIDER,
    transitions.REVIEW_2_BY_CUSTOMER,
    transitions.REVIEW_2_BY_PROVIDER,
  ].includes(transition);
};

export const isCustomerReview = transition => {
  return [transitions.REVIEW_1_BY_CUSTOMER, transitions.REVIEW_2_BY_CUSTOMER].includes(transition);
};

export const isProviderReview = transition => {
  return [transitions.REVIEW_1_BY_PROVIDER, transitions.REVIEW_2_BY_PROVIDER].includes(transition);
};

export const isPrivileged = transition => {
  return [
    transitions.REQUEST_PAYMENT,
    transitions.REQUEST_PAYMENT_AFTER_INQUIRY,
    transitions.COMPLETE_PICKUP,
  ].includes(transition);
};

export const supportedPayments = {
  stripe: {
    ...stripePaymentMethodInfo(PAYMENT_METHOD_CARD),
  },
};

export const getCheckoutPaymentTransitions = ({
  paymentProcessor,
  paymentMethod,
  state = 'initial',
  unsupportedPaymentErrorMessage,
}) => {
  const paymentConfig = supportedPayments[paymentProcessor]?.[paymentMethod];
  if (!paymentConfig) {
    const errorMessage =
      unsupportedPaymentErrorMessage ||
      `Unsupported payment: processor=${paymentProcessor}, method=${paymentMethod}`;
    throw new Error(errorMessage);
  }

  const isInquiry = state === states.INQUIRY;
  return {
    requestPaymentTransition: isInquiry
      ? transitions.REQUEST_PAYMENT_AFTER_INQUIRY
      : transitions.REQUEST_PAYMENT,
    confirmPaymentTransition: transitions.CONFIRM_PAYMENT,
  };
};

export const isCompleted = transition => {
  return [
    transitions.COMPLETE_PICKUP,
    transitions.AUTO_COMPLETE,
    transitions.REVIEW_1_BY_CUSTOMER,
    transitions.REVIEW_1_BY_PROVIDER,
    transitions.REVIEW_2_BY_CUSTOMER,
    transitions.REVIEW_2_BY_PROVIDER,
    transitions.EXPIRE_REVIEW_PERIOD,
    transitions.EXPIRE_CUSTOMER_REVIEW_PERIOD,
    transitions.EXPIRE_PROVIDER_REVIEW_PERIOD,
  ].includes(transition);
};

export const hasPaymentExpired = tx => {
  return tx?.attributes?.lastTransition === transitions.EXPIRE_PAYMENT;
};

export const isRefunded = transition => {
  return [
    transitions.EXPIRE_PAYMENT,
    transitions.DECLINE,
    transitions.EXPIRE,
    transitions.PROVIDER_CANCEL_FROM_ACCEPTED,
    transitions.PROVIDER_CANCEL_FROM_READY,
  ].includes(transition);
};

export const statesNeedingProviderAttention = [states.PREAUTHORIZED];
