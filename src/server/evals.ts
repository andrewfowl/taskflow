"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { reevaluateRelease } from "./release-eval";

// Record a model-impact measurement (EvalRun) against a release — the data →
// model feedback loop — then re-evaluate that release's gates so the
// model-impact gate goes live. See docs/data-production.md §7, §11.
export async function recordEvalRun(formData: FormData) {
  await requireAdmin();
  const releaseId = String(formData.get("releaseId") || "");
  const target = String(formData.get("target") || "").trim();
  if (!releaseId || !target) throw new Error("Release and target are required");
  const lift = Number.parseFloat(String(formData.get("lift") || "0")) || 0;
  const notes = String(formData.get("notes") || "").trim() || null;

  await prisma.evalRun.create({
    data: {
      releaseId,
      target,
      metrics: { lift, notes } as Prisma.InputJsonValue,
    },
  });

  await reevaluateRelease(releaseId);

  const { batchId } = await prisma.release.findUniqueOrThrow({
    where: { id: releaseId },
    select: { batchId: true },
  });
  revalidatePath(`/app/admin/batches/${batchId}`);
}
