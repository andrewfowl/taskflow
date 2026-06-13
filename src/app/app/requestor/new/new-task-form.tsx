"use client";

import { useActionState, useState } from "react";
import { createTask, type ActionState } from "@/server/tasks";
import { PRIORITIES } from "@/lib/constants";

type Field = {
  id: string;
  label: string;
  key: string;
  kind: string;
  required: boolean;
  helpText: string | null;
  options: string[];
  maxFiles: number | null;
  allowedMime: string | null;
};
type TaskType = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  fields: Field[];
};
type Entity = { id: string; name: string };

export function NewTaskForm({
  taskTypes,
  entities,
}: {
  taskTypes: TaskType[];
  entities: Entity[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(createTask, undefined);
  const [typeId, setTypeId] = useState(taskTypes[0]?.id ?? "");
  const selected = taskTypes.find((t) => t.id === typeId);

  return (
    <form action={formAction} className="space-y-6">
      {/* Task type */}
      <div className="card p-5">
        <label className="label" htmlFor="taskTypeId">Task type</label>
        <select
          id="taskTypeId"
          name="taskTypeId"
          className="input"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
        >
          {taskTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.category ? ` · ${t.category}` : ""}
            </option>
          ))}
        </select>
        {selected?.description && (
          <p className="mt-2 text-sm text-gray-500">{selected.description}</p>
        )}
      </div>

      {/* Core fields */}
      <div className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" name="title" required className="input" placeholder="Short summary of the request" />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={4} className="input" placeholder="Describe what you need in detail" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="priority">Priority</label>
            <select id="priority" name="priority" className="input" defaultValue="NORMAL">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dueDate">Due date</label>
            <input id="dueDate" name="dueDate" type="date" className="input" />
          </div>
        </div>
        {entities.length > 0 && (
          <div>
            <label className="label" htmlFor="entityId">Submit on behalf of</label>
            <select id="entityId" name="entityId" className="input" defaultValue="">
              <option value="">Myself (personal)</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Dynamic, task-type-specific fields */}
      {selected && selected.fields.length > 0 && (
        <div className="card space-y-4 p-5">
          <h3 className="font-semibold">{selected.name} details</h3>
          {selected.fields.map((f) => (
            <DynamicField key={f.id} field={f} />
          ))}
        </div>
      )}

      {/* Generic attachments */}
      <div className="card p-5">
        <label className="label" htmlFor="attachments">Additional attachments (optional)</label>
        <input id="attachments" name="attachments" type="file" multiple className="input" />
        <p className="mt-1 text-xs text-gray-500">Up to 25 MB per file. Stored privately.</p>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" name="intent" value="submit" className="btn-primary">
          Submit request
        </button>
        <button type="submit" name="intent" value="draft" className="btn-secondary">
          Save as draft
        </button>
      </div>
    </form>
  );
}

function DynamicField({ field }: { field: Field }) {
  const name = `field__${field.id}`;
  const label = (
    <label className="label" htmlFor={name}>
      {field.label}
      {field.required && <span className="text-rose-500"> *</span>}
    </label>
  );
  const help = field.helpText ? (
    <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
  ) : null;

  switch (field.kind) {
    case "TEXTAREA":
      return (
        <div>
          {label}
          <textarea id={name} name={name} rows={3} className="input" required={field.required} />
          {help}
        </div>
      );
    case "NUMBER":
      return (
        <div>
          {label}
          <input id={name} name={name} type="number" step="any" className="input" required={field.required} />
          {help}
        </div>
      );
    case "DATE":
      return (
        <div>
          {label}
          <input id={name} name={name} type="date" className="input" required={field.required} />
          {help}
        </div>
      );
    case "URL":
      return (
        <div>
          {label}
          <input id={name} name={name} type="url" className="input" placeholder="https://" required={field.required} />
          {help}
        </div>
      );
    case "CHECKBOX":
      return (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input name={name} type="checkbox" value="yes" />
          {field.label}
        </label>
      );
    case "SELECT":
      return (
        <div>
          {label}
          <select id={name} name={name} className="input" required={field.required} defaultValue="">
            <option value="" disabled>Select…</option>
            {field.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {help}
        </div>
      );
    case "MULTISELECT":
      return (
        <div>
          {label}
          <select id={name} name={name} className="input" multiple required={field.required}>
            {field.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {help}
        </div>
      );
    case "FILE":
      return (
        <div>
          {label}
          <input
            id={`file__${field.id}`}
            name={`file__${field.id}`}
            type="file"
            multiple={(field.maxFiles ?? 1) > 1}
            accept={field.allowedMime ?? undefined}
            className="input"
            required={field.required}
          />
          {help}
        </div>
      );
    default:
      return (
        <div>
          {label}
          <input id={name} name={name} className="input" required={field.required} />
          {help}
        </div>
      );
  }
}
