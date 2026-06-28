import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { evaluateGates } from "@/lib/release-gates";

// Re-run the objective gates for a release from current data (items, judgments,
// evals, and the client decision) and persist the outcome. Shared by
// createRelease, recordEvalRun, and decideClientAcceptance so the gate verdict
// stays consistent. An internal server helper — not a server action.
export async function reevaluateRelease(releaseId: string) {
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

  const { gates, passed } = evaluateGates(release.batch, items, judgments, evals, {
    status: release.clientStatus,
    slaAt: release.clientSlaAt,
  });

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
}

export function liftOf(metrics: Prisma.JsonValue): number {
  if (metrics && typeof metrics === "object" && !Array.isArray(metrics)) {
    const v = (metrics as Record<string, unknown>).lift;
    if (typeof v === "number") return v;
  }
  return 0;
}
