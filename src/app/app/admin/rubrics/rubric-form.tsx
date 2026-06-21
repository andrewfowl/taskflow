"use client";

import { createRubricVersion } from "@/server/rubrics";
import { SubmitButton } from "@/components/app/submit-button";

const USE_CASES = [
  "sft",
  "preference",
  "eval",
  "safety",
  "tool_use",
  "expert_reasoning",
  "ranking",
  "critique",
  "rewrite",
  "citation_check",
  "red_team",
];

export function RubricForm({ rubricId }: { rubricId?: string }) {
  return (
    <form action={createRubricVersion} className="card space-y-4 p-5">
      {rubricId ? (
        <input type="hidden" name="rubricId" value={rubricId} />
      ) : (
        <div>
          <label className="label">Rubric name</label>
          <input
            name="rubricName"
            required
            className="input"
            placeholder="Q3 SFT prompts"
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Version (blank = auto)</label>
          <input name="version" className="input" placeholder="v1" />
        </div>
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
      </div>
      <div>
        <label className="label">Unit of work</label>
        <input
          name="unitOfWork"
          className="input"
          placeholder="prompt · response · comparison pair · rating · critique"
        />
      </div>
      <div>
        <label className="label">Output schema</label>
        <textarea
          name="outputSchema"
          rows={2}
          className="input font-mono text-xs"
          placeholder='{"label": "…", "rationale": "…"}'
        />
      </div>
      <div>
        <label className="label">Rubric (excellent / acceptable / reject)</label>
        <textarea
          name="rubric"
          rows={3}
          className="input"
          placeholder="What 'excellent', 'acceptable', and 'reject' mean…"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Domain rules</label>
          <textarea
            name="domainRules"
            rows={2}
            className="input"
            placeholder="Expert criteria, prohibited content, factuality rules…"
          />
        </div>
        <div>
          <label className="label">Edge cases</label>
          <textarea
            name="edgeCases"
            rows={2}
            className="input"
            placeholder="Ambiguous examples + expected handling…"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Acceptance threshold</label>
          <input
            name="acceptanceThreshold"
            type="number"
            step="0.01"
            min={0}
            max={1}
            className="input w-32"
            placeholder="0.95"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            name="publish"
            className="h-4 w-4 rounded border-gray-300 text-brand-600"
          />
          Publish immediately
        </label>
      </div>
      <SubmitButton className="btn-primary">
        {rubricId ? "Create version" : "Create rubric"}
      </SubmitButton>
    </form>
  );
}
