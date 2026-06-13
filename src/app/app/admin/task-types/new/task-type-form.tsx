"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { createTaskType } from "@/server/task-types";
import { SubmitButton } from "@/components/app/submit-button";
import { TASKER_LEVELS } from "@/lib/constants";

const KINDS = ["TEXT", "TEXTAREA", "NUMBER", "DATE", "SELECT", "MULTISELECT", "CHECKBOX", "URL", "FILE"];

type Row = { uid: number };

export function TaskTypeForm() {
  const [rows, setRows] = useState<Row[]>([{ uid: 1 }, { uid: 2 }]);
  const [nextUid, setNextUid] = useState(3);

  const addRow = () => {
    setRows((r) => [...r, { uid: nextUid }]);
    setNextUid((n) => n + 1);
  };
  const removeRow = (uid: number) => setRows((r) => r.filter((x) => x.uid !== uid));

  return (
    <form action={createTaskType} className="space-y-6">
      <div className="card space-y-4 p-5">
        <div>
          <label className="label">Name</label>
          <input name="name" className="input" required placeholder="Market research report" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={2} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Category</label>
            <input name="category" className="input" placeholder="Research" />
          </div>
          <div>
            <label className="label">Required tasker level</label>
            <select name="requiredLevel" className="input" defaultValue="">
              <option value="">Any</option>
              {TASKER_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Default budget ($)</label>
            <input name="defaultBudget" type="number" step="any" className="input" />
          </div>
          <div>
            <label className="label">Default hours</label>
            <input name="defaultHours" type="number" step="any" className="input" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="autoAssign" /> Auto-assign (skip dispatcher triage when possible)
        </label>
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Intake fields</h3>
          <button type="button" onClick={addRow} className="btn-ghost text-sm">
            <Plus className="h-4 w-4" /> Add field
          </button>
        </div>
        <p className="text-sm text-gray-500">
          These are the questions and uploads a requestor fills in for this task type. Leave a label blank to skip a row.
        </p>
        {rows.map((row, idx) => (
          <div key={row.uid} className="rounded-lg border border-gray-200 p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_140px_120px_auto]">
              <input name="fieldLabel" className="input" placeholder={`Field ${idx + 1} label`} />
              <select name="fieldKind" className="input" defaultValue="TEXT">
                {KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <select name="fieldRequired" className="input" defaultValue="false">
                <option value="false">Optional</option>
                <option value="true">Required</option>
              </select>
              <button type="button" onClick={() => removeRow(row.uid)} className="btn-ghost text-rose-600" aria-label="Remove field">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input name="fieldHelp" className="input" placeholder="Help text (optional)" />
              <input name="fieldOptions" className="input" placeholder="Options for select, comma-separated" />
            </div>
          </div>
        ))}
      </div>

      <SubmitButton className="btn-primary">Create task type</SubmitButton>
    </form>
  );
}
