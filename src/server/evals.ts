"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { evaluateGates } from "@/lib/release-gates";

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

  // Re-evaluate the release's gates now that an eval exists.
  const release = await prisma.release.findUniqueOrThrow({
    where: { id: releaseId },
    include: { batch: true, evalRuns: { select: { metrics: true } } },
  });
  const items = await prisma.item.findMany({
    where: { batchId: release.batchId },
    select: { id: true, status: true, input: true, schemaVersion: true },
  });
  const judgments = await prisma.judgment.findMany({
    where: { item: { batchId: release.batchId } },
    select: { itemId: true, kind: true, decision: true, defects: true },
  });
  const evals = release.evalRuns.map((e) => ({ lift: liftOf(e.metrics) }));

  const { gates, passed } = evaluateGates(
    release.batch,
    items,
    judgments,
    evals,
  );

  await prisma.release.update({
    where: { id: releaseId },
    data: {
      status: passed ? "PASSED" : "GATED",
      gateResults: gates as unknown as Prisma.InputJsonValue,
    },
  });
  if (passed) {
    await prisma.batch.update({
      where: { id: release.batchId },
      data: { status: "RELEASED" },
    });
  }

  revalidatePath(`/app/admin/batches/${release.batchId}`);
}

function liftOf(metrics: Prisma.JsonValue): number {
  if (metrics && typeof metrics === "object" && !Array.isArray(metrics)) {
    const v = (metrics as Record<string, unknown>).lift;
    if (typeof v === "number") return v;
  }
  return 0;
}
