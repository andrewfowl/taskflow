import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PLAN_TIERS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Usage-based subscriptions for requestors. Hourly or fixed pay for taskers. A transparent platform commission.",
};

const order = ["FREE", "STARTER", "PRO", "ENTERPRISE"] as const;

export default function PricingPage() {
  return (
    <div className="container-px py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">Simple, usage-based pricing</h1>
        <p className="mt-4 text-gray-600">
          Requestors subscribe and pay for the volume they use. Taskers earn per
          task — hourly or fixed — and the platform takes a transparent
          commission. Self-host to remove platform fees entirely.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-4">
        {order.map((tier) => {
          const plan = PLAN_TIERS[tier];
          const highlighted = tier === "PRO";
          return (
            <div
              key={tier}
              className={`card flex flex-col p-6 ${
                highlighted ? "ring-2 ring-brand-500" : ""
              }`}
            >
              {highlighted && (
                <span className="badge mb-3 self-start bg-brand-100 text-brand-700">
                  Most popular
                </span>
              )}
              <div className="text-lg font-semibold">{plan.name}</div>
              <div className="mt-2">
                {tier === "ENTERPRISE" ? (
                  <span className="text-3xl font-bold">Custom</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-gray-500">/mo</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">{plan.blurb}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="h-5 w-5 flex-none text-brand-600" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier === "ENTERPRISE" ? "/docs/self-hosting" : "/register"}
                className={`mt-6 ${highlighted ? "btn-primary" : "btn-secondary"}`}
              >
                {tier === "ENTERPRISE" ? "Talk to us" : "Get started"}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-16 max-w-3xl rounded-xl border border-gray-200 bg-gray-50 p-8">
        <h2 className="text-xl font-semibold">How tasker compensation works</h2>
        <p className="mt-3 text-sm text-gray-600">
          When a tasker&apos;s plan is approved, the agreed price (hourly ×
          tracked time, or a fixed amount) becomes the gross payout. The
          platform deducts a commission (15% by default, fully configurable),
          and the remainder is the tasker&apos;s net earning. Every split is
          recorded as an auditable payout, settleable through Stripe Connect or
          your own process.
        </p>
      </div>
    </div>
  );
}
