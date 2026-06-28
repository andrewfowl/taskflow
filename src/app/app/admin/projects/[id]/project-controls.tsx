"use client";

import { addTaskToProject, addDependency } from "@/server/projects";
import { SubmitButton } from "@/components/app/submit-button";

type TaskOpt = { id: string; reference: string; title: string };

export function AddTaskForm({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: TaskOpt[];
}) {
  if (tasks.length === 0) {
    return <span className="text-xs text-gray-400">No unassigned tasks</span>;
  }
  return (
    <form action={addTaskToProject} className="flex items-end gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <select name="taskId" required defaultValue="" className="input">
        <option value="" disabled>
          Add a task…
        </option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.reference} — {t.title}
          </option>
        ))}
      </select>
      <SubmitButton className="btn-secondary">Add</SubmitButton>
    </form>
  );
}

export function AddDependencyForm({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: TaskOpt[];
}) {
  return (
    <form action={addDependency} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <select name="taskId" required defaultValue="" className="input">
        <option value="" disabled>
          Task…
        </option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.reference}
          </option>
        ))}
      </select>
      <span className="pb-2 text-sm text-gray-500">depends on</span>
      <select name="dependsOnTaskId" required defaultValue="" className="input">
        <option value="" disabled>
          Prerequisite…
        </option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.reference}
          </option>
        ))}
      </select>
      <SubmitButton className="btn-secondary">Add dependency</SubmitButton>
    </form>
  );
}
