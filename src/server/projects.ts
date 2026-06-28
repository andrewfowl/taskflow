"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { projectReference } from "@/lib/utils";

export async function createProject(formData: FormData) {
  const viewer = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Project name is required");
  const description = String(formData.get("description") || "").trim() || null;

  let reference = projectReference();
  for (
    let i = 0;
    i < 5 && (await prisma.project.findUnique({ where: { reference } }));
    i++
  ) {
    reference = projectReference();
  }

  const project = await prisma.project.create({
    data: { reference, name, description, ownerId: viewer.id },
  });
  revalidatePath("/app/admin/projects");
  redirect(`/app/admin/projects/${project.id}`);
}

export async function addTaskToProject(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId") || "");
  const taskId = String(formData.get("taskId") || "");
  if (!projectId || !taskId) throw new Error("Project and task are required");
  await prisma.task.update({ where: { id: taskId }, data: { projectId } });
  revalidatePath(`/app/admin/projects/${projectId}`);
}

export async function removeTaskFromProject(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId") || "");
  const taskId = String(formData.get("taskId") || "");
  if (!taskId) throw new Error("Task is required");
  await prisma.task.update({ where: { id: taskId }, data: { projectId: null } });
  revalidatePath(`/app/admin/projects/${projectId}`);
}

export async function addDependency(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId") || "");
  const taskId = String(formData.get("taskId") || "");
  const dependsOnTaskId = String(formData.get("dependsOnTaskId") || "");
  if (!taskId || !dependsOnTaskId) throw new Error("Pick both tasks");
  if (taskId === dependsOnTaskId) {
    throw new Error("A task cannot depend on itself");
  }

  const existing = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
  });
  if (existing) throw new Error("That dependency already exists");
  if (await wouldCycle(taskId, dependsOnTaskId)) {
    throw new Error("That dependency would create a cycle");
  }

  await prisma.taskDependency.create({ data: { taskId, dependsOnTaskId } });
  if (projectId) revalidatePath(`/app/admin/projects/${projectId}`);
}

export async function removeDependency(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("dependencyId") || "");
  const projectId = String(formData.get("projectId") || "");
  if (!id) throw new Error("Dependency is required");
  await prisma.taskDependency.delete({ where: { id } });
  if (projectId) revalidatePath(`/app/admin/projects/${projectId}`);
}

// Would adding "taskId depends on dependsOnId" close a cycle? True when
// dependsOnId can already reach taskId by following dependency edges.
async function wouldCycle(
  taskId: string,
  dependsOnId: string,
): Promise<boolean> {
  const edges = await prisma.taskDependency.findMany({
    select: { taskId: true, dependsOnTaskId: true },
  });
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const arr = adj.get(e.taskId);
    if (arr) arr.push(e.dependsOnTaskId);
    else adj.set(e.taskId, [e.dependsOnTaskId]);
  }
  const seen = new Set<string>();
  const queue: string[] = [dependsOnId];
  while (queue.length > 0) {
    const cur = queue.shift() as string;
    if (cur === taskId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of adj.get(cur) ?? []) queue.push(next);
  }
  return false;
}
