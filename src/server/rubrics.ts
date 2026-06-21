"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/utils";

// Create a rubric version — the versioned data contract that governs a batch.
// Used both to start a new rubric (provide a name) and to add a version to an
// existing one (provide rubricId). See docs/data-production.md §1.
export async function createRubricVersion(formData: FormData) {
  await requireAdmin();

  const existingRubricId = String(formData.get("rubricId") || "").trim();
  const rubricName = String(formData.get("rubricName") || "").trim();
  const rubricId = existingRubricId || slugify(rubricName);
  if (!rubricId) throw new Error("Rubric name is required");

  let version = String(formData.get("version") || "").trim();
  if (!version) {
    const count = await prisma.rubricVersion.count({ where: { rubricId } });
    version = `v${count + 1}`;
  }

  const exists = await prisma.rubricVersion.findUnique({
    where: { rubricId_version: { rubricId, version } },
  });
  if (exists) {
    throw new Error(`Version ${version} already exists for this rubric.`);
  }

  const str = (k: string) => String(formData.get(k) || "").trim() || null;
  const contract = {
    name: rubricName || rubricId,
    useCase: str("useCase") ?? "sft",
    unitOfWork: str("unitOfWork"),
    outputSchema: str("outputSchema"),
    rubric: str("rubric"),
    domainRules: str("domainRules"),
    edgeCases: str("edgeCases"),
  };

  const thresholdRaw = String(formData.get("acceptanceThreshold") || "").trim();
  const acceptanceThreshold = thresholdRaw
    ? new Prisma.Decimal(thresholdRaw)
    : null;

  await prisma.rubricVersion.create({
    data: {
      rubricId,
      version,
      contract: contract as Prisma.InputJsonValue,
      acceptanceThreshold,
      publishedAt: formData.get("publish") === "on" ? new Date() : null,
    },
  });

  revalidatePath("/app/admin/rubrics");
  redirect(`/app/admin/rubrics/${rubricId}`);
}

// Publish a rubric version (freeze it for production use).
export async function publishRubricVersion(formData: FormData) {
  await requireAdmin();
  const versionId = String(formData.get("versionId") || "");
  if (!versionId) throw new Error("Version is required");
  const v = await prisma.rubricVersion.update({
    where: { id: versionId },
    data: { publishedAt: new Date() },
  });
  revalidatePath(`/app/admin/rubrics/${v.rubricId}`);
}
