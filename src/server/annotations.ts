"use server";

import { revalidatePath } from "next/cache";
import {
  Prisma,
  DefectCode,
  type ItemStatus,
  type JudgmentKind,
  type QcDecision,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { computeAgreement } from "@/lib/agreement";

// A worker submits one independent annotation for an item. Once the item has
// collected K (= Batch.replicas) annotations it advances to ANNOTATED and its
// inter-annotator agreement is (re)computed onto Item.agreementScore.
export async function submitAnnotation(formData: FormData) {
  const viewer = await requireAdmin();
  const itemId = String(formData.get("itemId") || "");
  const raw = String(formData.get("data") || "").trim();
  if (!itemId || !raw) throw new Error("Item and data are required");

  let data: Prisma.InputJsonValue;
  try {
    data = JSON.parse(raw) as Prisma.InputJsonValue;
  } catch {
    throw new Error("Annotation data must be valid JSON");
  }

  const item = await prisma.item.findUniqueOrThrow({
    where: { id: itemId },
    include: { batch: { select: { id: true, replicas: true } } },
  });

  await prisma.annotation.create({
    data: { itemId, workerId: viewer.id, data },
  });

  const annotations = await prisma.annotation.findMany({
    where: { itemId },
    select: { data: true },
  });
  const agreement = computeAgreement(annotations);
  const status: ItemStatus =
    annotations.length >= item.batch.replicas ? "ANNOTATED" : "IN_ANNOTATION";

  await prisma.item.update({
    where: { id: itemId },
    data: {
      status,
      agreementScore: agreement != null ? new Prisma.Decimal(agreement) : null,
    },
  });

  revalidatePath(`/app/admin/batches/${item.batch.id}/items/${itemId}`);
}

// A reviewer records a Judgment on an item (optionally a specific annotation),
// reusing the QC decision + defect-code vocabulary, and advances the item.
export async function submitJudgment(formData: FormData) {
  const viewer = await requireAdmin();
  const itemId = String(formData.get("itemId") || "");
  if (!itemId) throw new Error("Item is required");
  const annotationId = String(formData.get("annotationId") || "") || null;
  const kind = String(formData.get("kind") || "REVIEW") as JudgmentKind;
  const decision = String(formData.get("decision") || "APPROVED") as QcDecision;
  const scoreRaw = String(formData.get("score") || "").trim();
  const score = scoreRaw ? parseInt(scoreRaw, 10) : null;
  const comments = String(formData.get("comments") || "").trim() || null;

  const allowed = new Set<string>(Object.values(DefectCode));
  const defects = formData
    .getAll("defects")
    .map(String)
    .filter((d): d is DefectCode => allowed.has(d));

  const item = await prisma.item.findUniqueOrThrow({
    where: { id: itemId },
    include: { batch: { select: { id: true } } },
  });

  await prisma.judgment.create({
    data: {
      itemId,
      annotationId,
      reviewerId: viewer.id,
      kind,
      decision,
      score,
      defects,
      comments,
    },
  });

  // Advance the item per the decision.
  const next: ItemStatus =
    decision === "APPROVED"
      ? "ACCEPTED"
      : decision === "REJECTED"
        ? "REJECTED"
        : decision === "ESCALATED"
          ? "ADJUDICATION"
          : "IN_ANNOTATION"; // REVISION_REQUESTED → back for rework
  await prisma.item.update({ where: { id: itemId }, data: { status: next } });

  revalidatePath(`/app/admin/batches/${item.batch.id}/items/${itemId}`);
}
