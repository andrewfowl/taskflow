"use client";

import { assignTask } from "@/server/assignment";
import { SubmitButton } from "@/components/app/submit-button";

type Option = { id: string; name: string | null };

export function AssignForm({
  taskId,
  taskers,
  teams,
}: {
  taskId: string;
  taskers: Option[];
  teams: Option[];
}) {
  return (
    <form action={assignTask} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      <div>
        <label className="label">Assign to tasker</label>
        <select name="assigneeId" className="input" defaultValue="">
          <option value="">— none —</option>
          {taskers.map((t) => (
            <option key={t.id} value={t.id}>{t.name ?? t.id}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">…or a team</label>
        <select name="teamId" className="input" defaultValue="">
          <option value="">— none —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <input name="note" className="input" placeholder="Note (optional)" />
      <SubmitButton className="btn-primary w-full">Assign / reassign</SubmitButton>
    </form>
  );
}
