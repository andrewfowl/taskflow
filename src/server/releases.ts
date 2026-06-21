"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { evaluateGates } from "@/lib/release-gates";

// Cut a new Release for a batch: evaluate the objective gates, store the
// per-gate results and an auto-generated dataset card, and set the release
// status to PASSED / GATED accordingly. See docs/data-production.md §7.
export async function createRelease(formData: FormData) {
  await requireAdmin();
  const batchId = String(formData.get("batchId") || "");
  if (!batchId) throw new Error("Batch is required");

  const batch = await prisma.batch.findUniqueOrThrow({
    where: { id: batchId },
    include: {
      rubricVersion: true,
      _count: { select: { releases: true } },
    },
  });
  const items = await prisma.item.findMany({
    where: { batchId },
    select: { status: true, input: true, schemaVersion: true },
  });

  const { gates, passed } = evaluateGates(batch, items);

  const now = new Date();
  const seq = batch._count.releases + 1;
  const version = `ds-${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${seq}`;

  // Google Data Card-style documentation, generated from the batch + rubric.
  const datasetCard = {
    name: batch.rubricVersion.rubricId,
    rubricVersion: batch.rubricVersion.version,
    contract: batch.rubricVersion.contract,
    batch: batch.reference,
    kind: batch.kind,
    replicas: batch.replicas,
    itemCount: items.length,
    generatedAt: now.toISOString(),
  };

  await prisma.release.create({
    data: {
      batchId,
      version,
      status: passed ? "PASSED" : "GATED",
      gateResults: gates as unknown as Prisma.InputJsonValue,
      datasetCard: datasetCard as Prisma.InputJsonValue,
    },
  });

  // A passing release marks the batch released.
  if (passed) {
    await prisma.batch.update({
      where: { id: batchId },
      data: { status: "RELEASED" },
    });
  }

  revalidatePath(`/app/admin/batches/${batchId}`);
}
