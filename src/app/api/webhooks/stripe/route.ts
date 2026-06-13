import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

// Minimal Stripe webhook receiver. Verifies the signature when configured and
// reconciles subscription status. Kept provider-thin on purpose.
export async function POST(req: Request) {
  if (env.payments.driver !== "stripe" || !env.payments.stripeSecretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.payments.stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  let event: import("stripe").Stripe.Event;
  try {
    if (env.payments.stripeWebhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, env.payments.stripeWebhookSecret);
    } else {
      event = JSON.parse(body) as import("stripe").Stripe.Event;
    }
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as import("stripe").Stripe.Checkout.Session;
      const subscriptionId = session.metadata?.subscriptionId;
      if (subscriptionId) {
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: "ACTIVE",
            externalCustomerId: (session.customer as string) ?? undefined,
            externalSubscriptionId: (session.subscription as string) ?? undefined,
          },
        }).catch(() => {});
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as import("stripe").Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { externalSubscriptionId: sub.id },
        data: { status: "CANCELLED" },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
