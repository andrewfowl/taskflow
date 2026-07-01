"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type ClientDecision } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, requireViewer } from "@/lib/session";
import { reevaluateRelease } from "./release-eval";

// A pending release is deemed accepted by the client after this SLA window.
const CLIENT_SLA_DAYS = 3;

// Cut a new Release for a batch: generate a dataset card, open a client-
// acceptance window, and evaluate the objective gates.
// See docs/data-production.md §7.
export async function createRelease(formData: FormData) {
  await requireAdmin();
  const batchId = String(formData.get("batchId") || "");
  if (!batchId) throw new Error("Batch is required");

  const batch = await prisma.batch.findUniqueOrThrow({
    where: { id: batchId },
    include: { rubricVersion: true, _count: { select: { releases: true } } },
  });
  const itemCount = await prisma.item.count({ where: { batchId } });

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
    itemCount,
    generatedAt: now.toISOString(),
  };

  const release = await prisma.release.create({
    data: {
      batchId,
      version,
      status: "DRAFT",
      datasetCard: datasetCard as Prisma.InputJsonValue,
      clientStatus: "PENDING",
      clientSlaAt: new Date(now.getTime() + CLIENT_SLA_DAYS * 86_400_000),
    },
  });

  await reevaluateRelease(release.id);
  revalidatePath(`/app/admin/batches/${batchId}`);
}

// Record the client's sign-off decision on a release, then re-evaluate gates.
// A platform admin can decide on anyone's behalf; a buyer can sign off on their
// own org's release if they manage the commissioning entity (OWNER/ADMIN).
export async function decideClientAcceptance(formData: FormData) {
  const viewer = await requireViewer();
  const releaseId = String(formData.get("releaseId") || "");
  const decision = String(formData.get("decision") || "") as ClientDecision;
  if (!releaseId || (decision !== "ACCEPTED" && decision !== "REJECTED")) {
    throw new Error("A release and an accept/reject decision are required");
  }

  const release = await prisma.release.findUniqueOrThrow({
    where: { id: releaseId },
    select: { batchId: true, batch: { select: { entityId: true } } },
  });

  if (!viewer.isPlatformAdmin) {
    const entityId = release.batch.entityId;
    const membership = entityId
      ? await prisma.membership.findUnique({
          where: { userId_entityId: { userId: viewer.id, entityId } },
        })
      : null;
    const isManager =
      membership?.role === "OWNER" || membership?.role === "ADMIN";
    if (!isManager) throw new Error("Not permitted");
  }

  await prisma.release.update({
    where: { id: releaseId },
    data: { clientStatus: decision, clientDecidedAt: new Date() },
  });

  await reevaluateRelease(releaseId);
  revalidatePath(`/app/admin/batches/${release.batchId}`);
  revalidatePath(`/app/requestor/batches/${release.batchId}`);
}
