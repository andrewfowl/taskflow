"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { getTaskAccess } from "@/lib/access";
import { storeUploadedFile } from "@/lib/files";
import { audit, notify } from "@/lib/activity";

// Log time against a task (actual resource spend). Producers only. If no cost
// is supplied we derive it from the tasker's hourly rate.
export async function logTime(formData: FormData) {
  const viewer = await requireViewer();
  const taskId = String(formData.get("taskId") || "");
  const access = await getTaskAccess(viewer, taskId);
  if (!access || !access.canSubmitWork) throw new Error("Not permitted");

  const minutes = parseInt(String(formData.get("minutes") || "0"), 10);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("Enter minutes greater than zero");
  }
  const description = String(formData.get("description") || "").trim() || null;

  let costAmount: Prisma.Decimal | null = null;
  const explicitCost = String(formData.get("costAmount") || "").trim();
  if (explicitCost) {
    costAmount = new Prisma.Decimal(Number(explicitCost) || 0);
  } else {
    const profile = await prisma.taskerProfile.findUnique({
      where: { userId: viewer.id },
      select: { hourlyRate: true },
    });
    if (profile?.hourlyRate) {
      costAmount = new Prisma.Decimal(
        (Number(profile.hourlyRate) * minutes) / 60,
      );
    }
  }

  await prisma.timeEntry.create({
    data: { taskId, taskerId: viewer.id, minutes, description, costAmount },
  });
  await audit({
    actorId: viewer.id,
    action: "time.logged",
    targetType: "Task",
    targetId: taskId,
    meta: { minutes },
  });
  revalidatePath(`/app/tasks/${taskId}`);
}

// Submit a deliverable (with files) for quality control. Producers only.
export async function submitDeliverable(formData: FormData) {
  const viewer = await requireViewer();
  const taskId = String(formData.get("taskId") || "");
  const access = await getTaskAccess(viewer, taskId);
  if (!access || !access.canSubmitWork) throw new Error("Not permitted");

  const title = String(formData.get("title") || "").trim() || "Deliverable";
  const notes = String(formData.get("notes") || "").trim() || null;
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) throw new Error("Attach at least one file");

  const priorCount = await prisma.deliverable.count({ where: { taskId } });

  const deliverable = await prisma.deliverable.create({
    data: {
      taskId,
      taskerId: viewer.id,
      title,
      notes,
      version: priorCount + 1,
      status: "SUBMITTED",
    },
  });

  for (const file of files) {
    await storeUploadedFile({
      file,
      uploaderId: viewer.id,
      taskId,
      deliverableId: deliverable.id,
      scope: "TASKER_DELIVERABLE",
    });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: "SUBMITTED_FOR_QC", completedAt: new Date() },
  });

  await audit({
    actorId: viewer.id,
    action: "deliverable.submitted",
    targetType: "Task",
    targetId: taskId,
    meta: { deliverableId: deliverable.id, version: deliverable.version },
  });
  void task;
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath("/app/admin/qc");
}
