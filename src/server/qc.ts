"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type QcDecision } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { getTaskAccess } from "@/lib/access";
import { computePayout } from "@/lib/payments";
import { audit, notify } from "@/lib/activity";

async function requireQcAccess(taskId: string) {
  const viewer = await requireViewer();
  const access = await getTaskAccess(viewer, taskId);
  if (!access || !access.canReviewQc) throw new Error("Not permitted");
  return viewer;
}

export async function startQc(taskId: string) {
  const viewer = await requireQcAccess(taskId);
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "QC_IN_REVIEW" },
  });
  await audit({ actorId: viewer.id, action: "qc.started", targetType: "Task", targetId: taskId });
  revalidatePath(`/app/tasks/${taskId}`);
}

// Primary QC decision: approve, request revision, or escalate for a second
// opinion. Records a scored, auditable review either way.
export async function submitQcReview(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  const viewer = await requireQcAccess(taskId);
  const decision = String(formData.get("decision") || "") as QcDecision;
  const score = formData.get("score") ? parseInt(String(formData.get("score")), 10) : null;
  const comments = String(formData.get("comments") || "").trim() || null;
  const deliverableId = String(formData.get("deliverableId") || "") || null;

  const review = await prisma.qcReview.create({
    data: {
      taskId,
      deliverableId,
      reviewerId: viewer.id,
      kind: "PRIMARY_QC",
      decision,
      score,
      comments,
    },
  });

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });

  if (decision === "APPROVED") {
    await prisma.task.update({ where: { id: taskId }, data: { status: "APPROVED" } });
    if (deliverableId) {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "APPROVED" } });
    }
  } else if (decision === "ESCALATED") {
    await prisma.task.update({ where: { id: taskId }, data: { status: "SECOND_OPINION" } });
  } else {
    // REVISION_REQUESTED or REJECTED → send back to the tasker.
    await prisma.task.update({ where: { id: taskId }, data: { status: "REVISION_REQUESTED" } });
    if (deliverableId) {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "REJECTED" } });
    }
    if (task.assigneeId) {
      await notify({
        userId: task.assigneeId,
        type: "qc.revision",
        title: `Revision requested on ${task.reference}`,
        body: comments ?? undefined,
        link: `/app/tasks/${taskId}`,
      });
    }
  }

  await audit({
    actorId: viewer.id,
    action: "qc.reviewed",
    targetType: "Task",
    targetId: taskId,
    meta: { decision, reviewId: review.id },
  });
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath("/app/admin/qc");
}

// Second-opinion decision on an escalated task.
export async function submitSecondOpinion(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  const viewer = await requireQcAccess(taskId);
  const approve = formData.get("decision") === "approve";
  const comments = String(formData.get("comments") || "").trim() || null;
  const parentReviewId = String(formData.get("parentReviewId") || "") || null;

  await prisma.qcReview.create({
    data: {
      taskId,
      reviewerId: viewer.id,
      kind: "SECOND_OPINION",
      decision: approve ? "APPROVED" : "REVISION_REQUESTED",
      comments,
      parentReviewId,
    },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { status: approve ? "APPROVED" : "REVISION_REQUESTED" },
  });

  await audit({
    actorId: viewer.id,
    action: "qc.second_opinion",
    targetType: "Task",
    targetId: taskId,
    meta: { approve },
  });
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath("/app/admin/qc");
}

// Release the approved work to the requestor and generate the tasker payout,
// net of platform commission.
export async function deliverTask(taskId: string) {
  const viewer = await requireQcAccess(taskId);
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  if (task.status !== "APPROVED") throw new Error("Task must be approved first");

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });
    await tx.deliverable.updateMany({
      where: { taskId, status: "APPROVED" },
      data: { status: "DELIVERED" },
    });

    // Create the payout if there's an assignee and a known price.
    if (task.assigneeId && task.budgetAmount) {
      const gross = Number(task.budgetAmount);
      const split = computePayout(gross);
      await tx.payout.create({
        data: {
          taskerId: task.assigneeId,
          taskId,
          grossAmount: new Prisma.Decimal(split.grossAmount),
          commissionRate: new Prisma.Decimal(split.commissionRate),
          commissionAmount: new Prisma.Decimal(split.commissionAmount),
          netAmount: new Prisma.Decimal(split.netAmount),
          currency: task.currency,
          status: "PENDING",
        },
      });
    }
  });

  await notify({
    userId: task.requestorId,
    type: "task.delivered",
    title: `${task.reference} delivered`,
    body: task.title,
    link: `/app/tasks/${taskId}`,
  });
  await audit({ actorId: viewer.id, action: "task.delivered", targetType: "Task", targetId: taskId });
  revalidatePath(`/app/tasks/${taskId}`);
}
