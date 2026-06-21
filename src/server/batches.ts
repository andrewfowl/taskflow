"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma, type BatchKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { batchReference, slugify } from "@/lib/utils";

const BATCH_KINDS: BatchKind[] = ["PILOT", "PRODUCTION", "CALIBRATION", "REWORK"];

// Create a data-production Batch together with the RubricVersion that governs
// it (the data contract). Admin-only. The Batch is the controlled release unit
// of Items. See docs/data-production.md.
export async function createBatch(formData: FormData) {
  await requireAdmin();

  const rubricName = String(formData.get("rubricName") || "").trim();
  if (!rubricName) throw new Error("Rubric name is required");
  const versionLabel = String(formData.get("version") || "").trim() || "v1";
  const useCase = String(formData.get("useCase") || "").trim() || "sft";
  const notes = String(formData.get("notes") || "").trim();

  const kindRaw = String(formData.get("kind") || "PRODUCTION") as BatchKind;
  const kind = BATCH_KINDS.includes(kindRaw) ? kindRaw : "PRODUCTION";
  const replicas = Math.max(
    1,
    parseInt(String(formData.get("replicas") || "1"), 10) || 1,
  );
  const targetRaw = String(formData.get("targetCount") || "").trim();
  const targetCount = targetRaw ? parseInt(targetRaw, 10) : null;
  const thresholdRaw = String(formData.get("acceptanceThreshold") || "").trim();
  const acceptanceThreshold = thresholdRaw
    ? new Prisma.Decimal(thresholdRaw)
    : null;

  const rubricId = slugify(rubricName) || "rubric";

  // Find-or-create the governing rubric version (rubricId + version is unique).
  const rubricVersion =
    (await prisma.rubricVersion.findUnique({
      where: { rubricId_version: { rubricId, version: versionLabel } },
    })) ??
    (await prisma.rubricVersion.create({
      data: {
        rubricId,
        version: versionLabel,
        contract: { name: rubricName, useCase, notes },
        publishedAt: new Date(),
      },
    }));

  // Generate a unique human reference (retry on the rare collision).
  let reference = batchReference();
  for (
    let i = 0;
    i < 5 && (await prisma.batch.findUnique({ where: { reference } }));
    i++
  ) {
    reference = batchReference();
  }

  const batch = await prisma.batch.create({
    data: {
      reference,
      rubricVersionId: rubricVersion.id,
      kind,
      replicas,
      targetCount,
      acceptanceThreshold,
    },
  });

  revalidatePath("/app/admin/batches");
  redirect(`/app/admin/batches/${batch.id}`);
}

// Bulk-ingest Items into a batch from newline-delimited JSON (one object per
// line) or a single JSON array. Each row becomes an Item awaiting annotation.
export async function addItems(formData: FormData) {
  await requireAdmin();
  const batchId = String(formData.get("batchId") || "");
  const schemaVersion =
    String(formData.get("schemaVersion") || "").trim() || "v1";
  const raw = String(formData.get("items") || "").trim();
  if (!batchId || !raw) throw new Error("Batch and items are required");

  let inputs: unknown[];
  try {
    const parsed = JSON.parse(raw);
    inputs = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // Fall back to newline-delimited JSON objects.
    inputs = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
  if (inputs.length === 0) throw new Error("No items parsed");

  await prisma.item.createMany({
    data: inputs.map((input) => ({
      batchId,
      input: input as Prisma.InputJsonValue,
      schemaVersion,
    })),
  });

  revalidatePath(`/app/admin/batches/${batchId}`);
}
