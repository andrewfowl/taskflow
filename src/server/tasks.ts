"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { getTaskAccess } from "@/lib/access";
import { storeUploadedFile } from "@/lib/files";
import { taskReference } from "@/lib/utils";
import { STATUS_TRANSITIONS } from "@/lib/constants";
import { audit, notify } from "@/lib/activity";

export type ActionState = { error?: string; ok?: boolean } | undefined;

async function uniqueReference(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const ref = taskReference();
    const exists = await prisma.task.findUnique({ where: { reference: ref } });
    if (!exists) return ref;
  }
  return `TF-${Date.now().toString(36).toUpperCase()}`;
}

// Create (and optionally submit) a task. Handles the task type's custom fields,
// including file uploads, and meters subscription usage on submit.
export async function createTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await requireViewer();

  const taskTypeId = String(formData.get("taskTypeId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priority = String(formData.get("priority") || "NORMAL");
  const dueRaw = String(formData.get("dueDate") || "");
  const entityId = String(formData.get("entityId") || "") || null;
  const submit = formData.get("intent") === "submit";

  if (!title) return { error: "A title is required." };

  const taskType = await prisma.taskType.findUnique({
    where: { id: taskTypeId },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!taskType) return { error: "Pick a valid task type." };

  // If submitting on behalf of an entity, the viewer must be a member.
  if (entityId) {
    const membership = await prisma.membership.findUnique({
      where: { userId_entityId: { userId: viewer.id, entityId } },
    });
    if (!membership) return { error: "You are not a member of that entity." };
  }

  // Validate required fields before we write anything.
  for (const field of taskType.fields) {
    if (!field.required) continue;
    if (field.kind === "FILE") {
      const files = formData.getAll(`file__${field.id}`).filter(isRealFile);
      if (files.length === 0) {
        return { error: `“${field.label}” requires at least one file.` };
      }
    } else {
      const v = String(formData.get(`field__${field.id}`) || "").trim();
      if (!v) return { error: `“${field.label}” is required.` };
    }
  }

  let taskId = "";
  try {
    const created = await prisma.task.create({
      data: {
        reference: await uniqueReference(),
        title,
        description: description || null,
        priority: priority as Prisma.TaskCreateInput["priority"],
        status: submit ? "TRIAGE" : "DRAFT",
        submittedAt: submit ? new Date() : null,
        dueDate: dueRaw ? new Date(dueRaw) : null,
        taskTypeId: taskType.id,
        requestorId: viewer.id,
        entityId,
        requiredLevel: taskType.requiredLevel,
        budgetAmount: taskType.defaultBudget,
        budgetHours: taskType.defaultHours,
      },
    });
    taskId = created.id;

    // Persist non-file field values.
    for (const field of taskType.fields) {
      if (field.kind === "FILE") continue;
      const raw = formData.get(`field__${field.id}`);
      if (raw === null || raw === "") continue;
      const value: Prisma.InputJsonValue =
        field.kind === "NUMBER" ? Number(raw) : String(raw);
      await prisma.taskFieldValue.create({
        data: { taskId, fieldId: field.id, value },
      });
    }

    // Store uploaded files (both field-scoped and generic attachments).
    for (const field of taskType.fields) {
      if (field.kind !== "FILE") continue;
      const files = formData.getAll(`file__${field.id}`).filter(isRealFile);
      for (const file of files) {
        await storeUploadedFile({
          file,
          uploaderId: viewer.id,
          taskId,
          fieldId: field.id,
          scope: "REQUESTOR_INPUT",
        });
      }
    }
    for (const file of formData.getAll("attachments").filter(isRealFile)) {
      await storeUploadedFile({
        file,
        uploaderId: viewer.id,
        taskId,
        scope: "REQUESTOR_INPUT",
      });
    }

    if (submit) {
      await meterUsage(viewer.id, entityId, taskId);
      await audit({
        actorId: viewer.id,
        action: "task.submitted",
        targetType: "Task",
        targetId: taskId,
      });
    }
  } catch (e) {
    if (taskId) {
      // best-effort cleanup of a half-created task
      await prisma.task.delete({ where: { id: taskId } }).catch(() => {});
    }
    return { error: "Could not create the task. Please try again." };
  }

  redirect(`/app/tasks/${taskId}`);
}

function isRealFile(v: FormDataEntryValue): v is File {
  return v instanceof File && v.size > 0;
}

async function meterUsage(
  userId: string,
  entityId: string | null,
  taskId: string,
) {
  const sub = await prisma.subscription.findFirst({
    where: entityId ? { entityId } : { ownerUserId: userId },
  });
  if (!sub) return;
  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: sub.id },
      data: { usageThisPeriod: { increment: 1 } },
    }),
    prisma.usageRecord.create({
      data: {
        subscriptionId: sub.id,
        taskId,
        units: 1,
        description: "Task submitted",
      },
    }),
  ]);
}

// Move a task to a new status, enforcing the allowed transition graph.
export async function changeStatus(taskId: string, next: TaskStatus) {
  const viewer = await requireViewer();
  const access = await getTaskAccess(viewer, taskId);
  if (!access) throw new Error("Not found");

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  const allowed = STATUS_TRANSITIONS[task.status] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(`Cannot move from ${task.status} to ${next}`);
  }

  // Authorisation per transition: requestors may submit/cancel their own draft;
  // producers may start/submit-for-QC; everything else is staff-only.
  const requestorMove =
    (access.isRequestor || access.isEntityManager) &&
    (next === "SUBMITTED" || next === "TRIAGE" || next === "CANCELLED");
  const producerMove =
    access.canSubmitWork &&
    (next === "IN_PROGRESS" || next === "SUBMITTED_FOR_QC");
  if (!access.canManage && !requestorMove && !producerMove) {
    throw new Error("Not permitted");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: next,
      startedAt:
        next === "IN_PROGRESS" && !task.startedAt ? new Date() : task.startedAt,
      submittedAt:
        next === "TRIAGE" && !task.submittedAt ? new Date() : task.submittedAt,
    },
  });
  await audit({
    actorId: viewer.id,
    action: "task.status_changed",
    targetType: "Task",
    targetId: taskId,
    meta: { from: task.status, to: next },
  });
  revalidatePath(`/app/tasks/${taskId}`);
}

export async function addComment(formData: FormData) {
  const viewer = await requireViewer();
  const taskId = String(formData.get("taskId") || "");
  const body = String(formData.get("body") || "").trim();
  const clientVisible = formData.get("clientVisible") === "on";
  if (!body) return;

  const access = await getTaskAccess(viewer, taskId);
  if (!access) throw new Error("Not permitted");

  // Only staff/producers may post internal notes; requestors post client notes.
  const visibility =
    clientVisible || (!access.canSubmitWork && !access.canManage)
      ? "CLIENT"
      : "INTERNAL";

  await prisma.comment.create({
    data: { taskId, authorId: viewer.id, body, visibility },
  });
  revalidatePath(`/app/tasks/${taskId}`);
}
