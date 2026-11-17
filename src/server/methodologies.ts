"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { getTaskAccess } from "@/lib/access";
import { slugify } from "@/lib/utils";
import { entryHasContent, parseSchema, sanitizeEntry, validateSchema } from "@/lib/methodology-schema";

export type MethodologyFormState = { error: string | null };
export type EntryFormState = { error: string | null; issues: string[]; savedAt: number };

type MethodologyValues = {
  name: string;
  description: string | null;
  taskTypeId: string | null;
  teamId: string | null;
  isPublished: boolean;
  schema: Prisma.InputJsonObject;
};

async function readMethodologyForm(
  formData: FormData,
  viewerId: string,
): Promise<{ error: string } | { values: MethodologyValues }> {
  const name = String(formData.get("name") || "").trim().slice(0, 120);
  const description = String(formData.get("description") || "").trim().slice(0, 2000) || null;
  const taskTypeId = String(formData.get("taskTypeId") || "") || null;
  const teamId = String(formData.get("teamId") || "") || null;
  const isPublished = formData.get("isPublished") === "on";
  if (!name) return { error: "Give the methodology a name." } as const;

  let rawSchema: unknown;
  try {
    rawSchema = JSON.parse(String(formData.get("schema") || ""));
  } catch {
    return { error: "The form structure could not be read. Reload the page and try again." } as const;
  }
  const result = validateSchema(rawSchema);
  if ("error" in result) return { error: result.error } as const;

  if (teamId) {
    const membership = await prisma.teamMembership.findFirst({ where: { userId: viewerId, teamId }, select: { id: true } });
    if (!membership) return { error: "You can only share with teams you belong to." } as const;
  }
  if (taskTypeId && !(await prisma.taskType.findUnique({ where: { id: taskTypeId }, select: { id: true } }))) {
    return { error: "That task type no longer exists." } as const;
  }

  return {
    values: {
      name,
      description,
      taskTypeId,
      teamId,
      isPublished,
      schema: result.schema as unknown as Prisma.InputJsonObject,
    },
  } as const;
}

export async function createMethodology(_prev: MethodologyFormState, formData: FormData): Promise<MethodologyFormState> {
  const viewer = await requireViewer();
  const form = await readMethodologyForm(formData, viewer.id);
  if ("error" in form) return { error: form.error };

  const base = slugify(form.values.name) || "methodology";
  let slug = base;
  let n = 1;
  while (await prisma.methodology.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${n++}`;

  const created = await prisma.methodology.create({
    data: { ...form.values, slug, ownerId: viewer.id },
  });
  revalidatePath("/app/tasker/methodologies");
  redirect(`/app/tasker/methodologies/${created.id}`);
}

export async function updateMethodology(_prev: MethodologyFormState, formData: FormData): Promise<MethodologyFormState> {
  const viewer = await requireViewer();
  const id = String(formData.get("id") || "");
  const existing = await prisma.methodology.findUnique({ where: { id }, select: { ownerId: true } });
  if (!existing || existing.ownerId !== viewer.id) return { error: "Only the owner can edit this methodology." };

  const form = await readMethodologyForm(formData, viewer.id);
  if ("error" in form) return { error: form.error };

  await prisma.methodology.update({ where: { id }, data: form.values });
  revalidatePath("/app/tasker/methodologies");
  revalidatePath(`/app/tasker/methodologies/${id}`);
  redirect(`/app/tasker/methodologies/${id}`);
}

// Document work on a task by filling in a methodology entry.
export async function addMethodologyEntry(prev: EntryFormState, formData: FormData): Promise<EntryFormState> {
  const viewer = await requireViewer();
  const methodologyId = String(formData.get("methodologyId") || "");
  const taskId = String(formData.get("taskId") || "");
  const fail = (error: string, issues: string[] = []) => ({ error, issues, savedAt: prev.savedAt });

  const access = await getTaskAccess(viewer, taskId);
  if (!access || !access.canSubmitWork) return fail("You can't document work on this task.");

  const methodology = await prisma.methodology.findFirst({
    where: { id: methodologyId, OR: [{ ownerId: viewer.id }, { isPublished: true }] },
    select: { schema: true },
  });
  if (!methodology) return fail("That methodology isn't available to you.");

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("data") || "{}"));
  } catch {
    return fail("The entry could not be read. Reload the page and try again.");
  }

  const { data, errors } = sanitizeEntry(parseSchema(methodology.schema), raw);
  if (errors.length > 0) return fail("Some fields need attention.", errors);
  if (!entryHasContent(data)) return fail("Fill in at least one field before saving.");

  await prisma.methodologyEntry.create({
    data: { methodologyId, taskId, authorId: viewer.id, data: data as Prisma.InputJsonObject },
  });
  revalidatePath(`/app/tasks/${taskId}`);
  return { error: null, issues: [], savedAt: Date.now() };
}
