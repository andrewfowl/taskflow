"use client";

import { createBatch } from "@/server/batches";
import { SubmitButton } from "@/components/app/submit-button";

const USE_CASES = [
  "sft",
  "preference",
  "eval",
  "safety",
  "tool_use",
  "critique",
  "rewrite",
  "citation_check",
];

export function BatchForm() {
  return (
    <form action={createBatch} className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Rubric name</label>
          <input
            name="rubricName"
            className="input"
            required
            placeholder="Q3 SFT prompts"
          />
        </div>
        <div>
          <label className="label">Rubric version</label>
          <input name="version" className="input" defaultValue="v1" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Use case</label>
          <select name="useCase" className="input" defaultValue="sft">
            {USE_CASES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Batch kind</label>
          <select name="kind" className="input" defaultValue="PRODUCTION">
            <option value="PILOT">Pilot</option>
            <option value="PRODUCTION">Production</option>
            <option value="CALIBRATION">Calibration</option>
            <option value="REWORK">Rework</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Contract notes</label>
        <textarea
          name="notes"
          rows={2}
          className="input"
          placeholder="Domain rules, edge cases, acceptance criteria…"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Replicas (K)</label>
          <input
            name="replicas"
            type="number"
            min={1}
            defaultValue={1}
            className="input"
          />
        </div>
        <div>
          <label className="label">Acceptance threshold</label>
          <input
            name="acceptanceThreshold"
            type="number"
            step="0.01"
            min={0}
            max={1}
            className="input"
            placeholder="0.95"
          />
        </div>
        <div>
          <label className="label">Target count</label>
          <input
            name="targetCount"
            type="number"
            min={1}
            className="input"
            placeholder="1000"
          />
        </div>
      </div>
      <SubmitButton className="btn-primary">Create batch</SubmitButton>
    </form>
  );
}
