import { env } from "@/lib/env";
import type { PaymentProvider } from "./types";
import { ManualPaymentProvider } from "./manual";
import { StripePaymentProvider } from "./stripe";

let cached: PaymentProvider | null = null;

export function payments(): PaymentProvider {
  if (cached) return cached;
  if (env.payments.driver === "stripe" && env.payments.stripeSecretKey) {
    cached = new StripePaymentProvider(env.payments.stripeSecretKey);
  } else {
    cached = new ManualPaymentProvider();
  }
  return cached;
}

// Pure commission math, used to split a task's price between the tasker and the
// platform. Provider-independent so it can be unit-tested and audited.
export function computePayout(grossAmount: number, commissionRate = env.payments.commissionRate) {
  const rate = Math.min(Math.max(commissionRate, 0), 1);
  const commissionAmount = round2(grossAmount * rate);
  const netAmount = round2(grossAmount - commissionAmount);
  return { grossAmount: round2(grossAmount), commissionRate: rate, commissionAmount, netAmount };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type { PaymentProvider } from "./types";
