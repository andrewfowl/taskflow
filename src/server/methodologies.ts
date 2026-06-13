"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { getTaskAccess } from "@/lib/access";
import { slugify } from "@/lib/utils";

// Default schema: a list of sections, each with fields. Taskers can edit this
// JSON to define how a class of work is documented.
const DEFAULT_SCHEMA = {
  sections: [
    {
      title: "Approach",
      fields: [{ key: "approach", label: "Approach taken", type: "textarea" }],
    },
    {
      title: "Findings",
      fields: [{ key: "findings", label: "Key findings", type: "textarea" }],
    },
  ],
};

export async function createMethodology(formData: FormData) {
  const viewer = await requireViewer();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const taskTypeId = String(formData.get("taskTypeId") || "") || null;
  const teamId = String(formData.get("teamId") || "") || null;
  const isPublished = formData.get("isPublished") === "on";
  const schemaRaw = String(formData.get("schema") || "").trim();
  if (!name) throw new Error("Name is required");

  let schema: Prisma.InputJsonValue = DEFAULT_SCHEMA;
  if (schemaRaw) {
    try {
      schema = JSON.parse(schemaRaw);
    } catch {
      throw new Error("Schema must be valid JSON");
    }
  }

  let slug = slugify(name) || "methodology";
  let n = 1;
  while (await prisma.methodology.findUnique({ where: { slug } })) slug = `${slugify(name)}-${n++}`;

  const created = await prisma.methodology.create({
    data: { name, description, slug, schema, ownerId: viewer.id, taskTypeId, teamId, isPublished },
  });
  redirect(`/app/tasker/methodologies/${created.id}`);
}

// Document work on a task by filling in a methodology entry.
export async function addMethodologyEntry(formData: FormData) {
  const viewer = await requireViewer();
  const methodologyId = String(formData.get("methodologyId") || "");
  const taskId = String(formData.get("taskId") || "");
  const dataRaw = String(formData.get("data") || "{}");

  const access = await getTaskAccess(viewer, taskId);
  if (!access || !access.canSubmitWork) throw new Error("Not permitted");

  let data: Prisma.InputJsonValue;
  try {
    data = JSON.parse(dataRaw);
  } catch {
    throw new Error("Entry data must be valid JSON");
  }

  await prisma.methodologyEntry.create({
    data: { methodologyId, taskId, authorId: viewer.id, data },
  });
  revalidatePath(`/app/tasks/${taskId}`);
}
