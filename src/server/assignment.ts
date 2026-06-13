"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { audit, notify } from "@/lib/activity";

// Assign or reassign a task. Dispatcher-only. Closes any prior active
// assignment (preserving history) and records the new one.
export async function assignTask(formData: FormData) {
  const viewer = await requireViewer();
  if (!viewer.isPlatformAdmin) throw new Error("Not permitted");

  const taskId = String(formData.get("taskId") || "");
  const assigneeId = String(formData.get("assigneeId") || "") || null;
  const teamId = String(formData.get("teamId") || "") || null;
  const note = String(formData.get("note") || "").trim() || null;

  if (!assigneeId && !teamId) throw new Error("Pick a tasker or a team");

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });

  await prisma.$transaction(async (tx) => {
    // Close out current active assignment(s) as reassigned.
    await tx.assignment.updateMany({
      where: { taskId, status: "ACTIVE" },
      data: { status: "REASSIGNED", endedAt: new Date() },
    });
    await tx.assignment.create({
      data: {
        taskId,
        assigneeId,
        teamId,
        assignedById: viewer.id,
        note,
        status: "ACTIVE",
      },
    });
    await tx.task.update({
      where: { id: taskId },
      data: {
        assigneeId,
        assignedTeamId: teamId,
        status: task.status === "TRIAGE" || task.status === "SUBMITTED" ? "ASSIGNED" : task.status,
        assignedAt: new Date(),
      },
    });
  });

  if (assigneeId) {
    await notify({
      userId: assigneeId,
      type: "task.assigned",
      title: `You were assigned ${task.reference}`,
      body: task.title,
      link: `/app/tasks/${taskId}`,
    });
  }
  await audit({
    actorId: viewer.id,
    action: "task.assigned",
    targetType: "Task",
    targetId: taskId,
    meta: { assigneeId, teamId },
  });
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath("/app/admin/triage");
}

// A tasker claims an open (unassigned, in-triage) task for themselves.
export async function claimTask(formData: FormData) {
  const viewer = await requireViewer();
  const taskId = String(formData.get("taskId") || "");

  const profile = await prisma.taskerProfile.findUnique({
    where: { userId: viewer.id },
  });
  if (!profile) throw new Error("Only taskers can claim work");

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  if (task.assigneeId) throw new Error("Already assigned");
  if (!["TRIAGE", "SUBMITTED"].includes(task.status)) {
    throw new Error("This task is not open for claiming");
  }

  await prisma.$transaction([
    prisma.assignment.create({
      data: {
        taskId,
        assigneeId: viewer.id,
        assignedById: viewer.id,
        status: "ACTIVE",
        note: "Self-claimed",
      },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: viewer.id, status: "ASSIGNED", assignedAt: new Date() },
    }),
  ]);
  await audit({ actorId: viewer.id, action: "task.claimed", targetType: "Task", targetId: taskId });
  redirect(`/app/tasks/${taskId}`);
}
