"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { getTaskAccess } from "@/lib/access";
import { audit, notify } from "@/lib/activity";

function toDecimal(v: FormDataEntryValue | null): Prisma.Decimal | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? new Prisma.Decimal(n) : null;
}

// A tasker proposes a budget/plan for a task. Producers only.
export async function submitPlan(formData: FormData) {
  const viewer = await requireViewer();
  const taskId = String(formData.get("taskId") || "");
  const access = await getTaskAccess(viewer, taskId);
  if (!access || !access.canSubmitWork) throw new Error("Not permitted");

  const pricingModel =
    String(formData.get("pricingModel") || "FIXED") === "HOURLY"
      ? "HOURLY"
      : "FIXED";
  const estimatedHours = toDecimal(formData.get("estimatedHours"));
  const hourlyRate = toDecimal(formData.get("hourlyRate"));
  const fixedPrice = toDecimal(formData.get("fixedPrice"));
  const summary = String(formData.get("summary") || "").trim() || null;

  const plan = await prisma.projectPlan.create({
    data: {
      taskId,
      taskerId: viewer.id,
      pricingModel,
      estimatedHours,
      hourlyRate,
      fixedPrice,
      summary,
      status: "PROPOSED",
      submittedAt: new Date(),
    },
  });

  // Optional milestones: milestoneTitle[] / milestoneAmount[] / milestoneHours[]
  const titles = formData.getAll("milestoneTitle").map(String);
  const amounts = formData.getAll("milestoneAmount").map(String);
  const hours = formData.getAll("milestoneHours").map(String);
  for (let i = 0; i < titles.length; i++) {
    if (!titles[i]?.trim()) continue;
    await prisma.planMilestone.create({
      data: {
        planId: plan.id,
        title: titles[i].trim(),
        amount: amounts[i] ? new Prisma.Decimal(Number(amounts[i]) || 0) : null,
        hours: hours[i] ? new Prisma.Decimal(Number(hours[i]) || 0) : null,
        order: i,
      },
    });
  }

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await notify({
    userId: task.requestorId,
    type: "plan.proposed",
    title: `A plan was proposed for ${task.reference}`,
    link: `/app/tasks/${taskId}`,
  });
  await audit({
    actorId: viewer.id,
    action: "plan.proposed",
    targetType: "Task",
    targetId: taskId,
  });
  revalidatePath(`/app/tasks/${taskId}`);
}

// Requestor (or entity manager / admin) approves or rejects a proposed plan.
export async function decidePlan(formData: FormData) {
  const viewer = await requireViewer();
  const planId = String(formData.get("planId") || "");
  const approve = formData.get("decision") === "approve";

  const plan = await prisma.projectPlan.findUniqueOrThrow({
    where: { id: planId },
  });
  const access = await getTaskAccess(viewer, plan.taskId);
  if (!access || !(access.isRequestor || access.isEntityManager || access.canManage)) {
    throw new Error("Not permitted");
  }

  await prisma.projectPlan.update({
    where: { id: planId },
    data: { status: approve ? "APPROVED" : "REJECTED", decidedAt: new Date() },
  });

  if (approve) {
    // Snapshot the approved plan onto the task budget.
    const amount =
      plan.pricingModel === "FIXED"
        ? plan.fixedPrice
        : plan.hourlyRate && plan.estimatedHours
          ? new Prisma.Decimal(
              Number(plan.hourlyRate) * Number(plan.estimatedHours),
            )
          : null;
    await prisma.task.update({
      where: { id: plan.taskId },
      data: { budgetAmount: amount, budgetHours: plan.estimatedHours },
    });
    // Supersede any other proposed plans.
    await prisma.projectPlan.updateMany({
      where: { taskId: plan.taskId, id: { not: planId }, status: "PROPOSED" },
      data: { status: "WITHDRAWN" },
    });
  }

  await notify({
    userId: plan.taskerId,
    type: approve ? "plan.approved" : "plan.rejected",
    title: `Your plan was ${approve ? "approved" : "rejected"}`,
    link: `/app/tasks/${plan.taskId}`,
  });
  await audit({
    actorId: viewer.id,
    action: approve ? "plan.approved" : "plan.rejected",
    targetType: "Task",
    targetId: plan.taskId,
  });
  revalidatePath(`/app/tasks/${plan.taskId}`);
}
