"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { payments } from "@/lib/payments";
import { audit } from "@/lib/activity";

// Mark a payout as paid. Admin-only. Routes through the payment provider so a
// real settlement (e.g. Stripe Connect transfer) can be wired in later.
export async function markPayoutPaid(formData: FormData) {
  const viewer = await requireAdmin();
  const payoutId = String(formData.get("payoutId") || "");

  const payout = await prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
  const result = await payments().createPayout({
    taskerId: payout.taskerId,
    amount: Number(payout.netAmount),
    currency: payout.currency,
    reference: payout.id,
  });

  await prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      externalId: result.externalId,
    },
  });
  await audit({ actorId: viewer.id, action: "payout.paid", targetType: "Payout", targetId: payoutId });
  revalidatePath("/app/admin/payouts");
}
