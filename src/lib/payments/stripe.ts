import Stripe from "stripe";
import type { PlanTier } from "@prisma/client";
import type { CheckoutResult, PaymentProvider, PayoutResult } from "./types";

// Stripe-backed billing. Note this is intentionally thin: price IDs are looked
// up from env so the same code works across Stripe accounts, and nothing
// Stripe-specific leaks into the rest of the app.
const PRICE_ENV: Record<PlanTier, string> = {
  FREE: "",
  STARTER: "STRIPE_PRICE_STARTER",
  PRO: "STRIPE_PRICE_PRO",
  ENTERPRISE: "STRIPE_PRICE_ENTERPRISE",
};

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
  }

  async createSubscriptionCheckout(opts: {
    subscriptionId: string;
    tier: PlanTier;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutResult> {
    const priceId = process.env[PRICE_ENV[opts.tier]];
    if (!priceId) {
      // No price configured for this tier — fall back to immediate activation.
      return { url: null, externalId: null };
    }
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: opts.customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      metadata: { subscriptionId: opts.subscriptionId },
    });
    return { url: session.url, externalId: session.id };
  }

  async recordUsage(opts: {
    externalSubscriptionId: string | null;
    units: number;
    description: string;
  }): Promise<void> {
    // Metered usage would be reported here via subscription items. Left as a
    // no-op until a metered price is configured; usage is also stored locally.
    void opts;
  }

  async createPayout(opts: {
    taskerId: string;
    amount: number;
    currency: string;
    reference: string;
  }): Promise<PayoutResult> {
    // Real payouts require Stripe Connect accounts per tasker. Until those are
    // onboarded we record the payout as pending for manual settlement.
    void opts;
    return { externalId: null, status: "PENDING" };
  }
}
