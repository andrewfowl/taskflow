import type { PlanTier } from "@prisma/client";

export type CheckoutResult = {
  // If the provider hosts a checkout page, its URL. Manual provider returns
  // null and the app marks the subscription active directly.
  url: string | null;
  externalId: string | null;
};

export type PayoutResult = {
  externalId: string | null;
  status: "PENDING" | "PAID";
};

// Contract every payment backend implements. Keeping billing behind this
// interface means Stripe can be replaced (or removed for self-hosting) without
// touching product code.
export interface PaymentProvider {
  readonly name: string;
  createSubscriptionCheckout(opts: {
    subscriptionId: string;
    tier: PlanTier;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutResult>;

  recordUsage(opts: {
    externalSubscriptionId: string | null;
    units: number;
    description: string;
  }): Promise<void>;

  createPayout(opts: {
    taskerId: string;
    amount: number;
    currency: string;
    reference: string;
  }): Promise<PayoutResult>;
}
