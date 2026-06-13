import type { CheckoutResult, PaymentProvider, PayoutResult } from "./types";

// The default, dependency-free provider. Subscriptions activate immediately,
// usage is metered in our own database, and payouts are tracked as records to
// be settled out-of-band (bank transfer, etc.). Perfect for self-hosting or
// for evaluating the platform without a Stripe account.
export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual";

  async createSubscriptionCheckout(): Promise<CheckoutResult> {
    return { url: null, externalId: null };
  }

  async recordUsage(): Promise<void> {
    // Usage is already persisted as UsageRecord rows by the caller.
  }

  async createPayout(): Promise<PayoutResult> {
    return { externalId: null, status: "PENDING" };
  }
}
