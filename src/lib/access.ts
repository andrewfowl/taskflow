import { prisma } from "@/lib/db";
import type { FileScope, StoredFile, TaskStatus } from "@prisma/client";

export type Viewer = { id: string; isPlatformAdmin: boolean };

export type TaskAccess = {
  canView: boolean;
  canManage: boolean; // dispatcher/admin actions: assign, reassign, change type
  isRequestor: boolean;
  isAssignee: boolean;
  isTeamMember: boolean;
  isEntityManager: boolean;
  canEditBrief: boolean;
  canAccessInputFiles: boolean;
  canAccessDeliverables: boolean;
  canReviewQc: boolean;
  canSubmitWork: boolean;
};

const DELIVERED_STATES: TaskStatus[] = ["APPROVED", "DELIVERED"];

// Resolve what a given viewer is allowed to do with a task. This is the single
// source of truth for authorisation across server actions, route handlers and
// pages — every entry point calls through here.
export async function getTaskAccess(
  viewer: Viewer,
  taskId: string,
): Promise<TaskAccess | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      status: true,
      requestorId: true,
      assigneeId: true,
      entityId: true,
      assignedTeamId: true,
    },
  });
  if (!task) return null;

  const isRequestor = task.requestorId === viewer.id;
  const isAssignee = task.assigneeId === viewer.id;

  // Entity managers (OWNER/ADMIN) can oversee every task in their entity.
  let isEntityManager = false;
  if (task.entityId) {
    const membership = await prisma.membership.findUnique({
      where: { userId_entityId: { userId: viewer.id, entityId: task.entityId } },
      select: { role: true },
    });
    isEntityManager =
      membership?.role === "OWNER" || membership?.role === "ADMIN";
  }

  // Team members of the assigned team — only if their membership grants file
  // access — can view the task and its input files.
  let isTeamMember = false;
  if (task.assignedTeamId) {
    const tm = await prisma.teamMembership.findUnique({
      where: {
        teamId_userId: { teamId: task.assignedTeamId, userId: viewer.id },
      },
      select: { canAccessFiles: true },
    });
    isTeamMember = Boolean(tm?.canAccessFiles);
  }

  const canManage = viewer.isPlatformAdmin;
  const canView =
    canManage || isRequestor || isAssignee || isTeamMember || isEntityManager;

  if (!canView) return null;

  const delivered = DELIVERED_STATES.includes(task.status);

  return {
    canView,
    canManage,
    isRequestor,
    isAssignee,
    isTeamMember,
    isEntityManager,
    // Requestor can edit the brief only before work starts.
    canEditBrief:
      (isRequestor || isEntityManager) &&
      (task.status === "DRAFT" || task.status === "SUBMITTED"),
    // Input files: staff + whoever is doing the work + the requesting side.
    canAccessInputFiles:
      canManage ||
      isAssignee ||
      isTeamMember ||
      isRequestor ||
      isEntityManager,
    // Deliverables: staff + producers always; requestor only once delivered.
    canAccessDeliverables:
      canManage ||
      isAssignee ||
      isTeamMember ||
      ((isRequestor || isEntityManager) && delivered),
    canReviewQc: canManage, // QC + second opinion are staff functions
    canSubmitWork: canManage || isAssignee || isTeamMember,
  };
}

// File-level check, derived from task access plus the file's scope.
export async function canAccessFile(
  viewer: Viewer,
  file: Pick<StoredFile, "scope" | "taskId" | "uploaderId">,
): Promise<boolean> {
  if (viewer.isPlatformAdmin) return true;
  if (file.uploaderId === viewer.id) return true;
  if (!file.taskId) return false;

  const access = await getTaskAccess(viewer, file.taskId);
  if (!access) return false;

  const scope: FileScope = file.scope;
  if (scope === "REQUESTOR_INPUT" || scope === "REFERENCE") {
    return access.canAccessInputFiles;
  }
  if (
    scope === "TASKER_DELIVERABLE" ||
    scope === "QC_ATTACHMENT" ||
    scope === "METHODOLOGY_ATTACHMENT"
  ) {
    return access.canAccessDeliverables;
  }
  return false;
}
