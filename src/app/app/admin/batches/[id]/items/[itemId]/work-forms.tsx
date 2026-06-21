"use client";

import { submitAnnotation, submitJudgment } from "@/server/annotations";
import { SubmitButton } from "@/components/app/submit-button";

const DEFECT_OPTIONS: [string, string][] = [
  ["INSTRUCTION_NONCOMPLIANCE", "Instruction noncompliance"],
  ["FACTUAL_ERROR", "Factual error"],
  ["REASONING_GAP", "Reasoning gap"],
  ["RUBRIC_MISMATCH", "Rubric mismatch"],
  ["PREFERENCE_INCONSISTENCY", "Preference inconsistency"],
  ["SAFETY_MISS", "Safety miss"],
  ["DOMAIN_ERROR", "Domain error"],
  ["SCHEMA_ERROR", "Formatting / schema error"],
  ["LOW_EFFORT", "Low effort"],
  ["HALLUCINATED_CITATION", "Hallucinated citation"],
  ["DUPLICATE", "Duplicate / near-duplicate"],
  ["REVIEWER_ERROR", "Reviewer error"],
];

export function AnnotationForm({ itemId }: { itemId: string }) {
  return (
    <form action={submitAnnotation} className="space-y-2">
      <input type="hidden" name="itemId" value={itemId} />
      <label className="label">Annotation (JSON)</label>
      <textarea
        name="data"
        rows={3}
        required
        className="input font-mono text-xs"
        placeholder='{"label": "A"}'
      />
      <SubmitButton className="btn-secondary">Submit annotation</SubmitButton>
    </form>
  );
}

export function JudgmentForm({ itemId }: { itemId: string }) {
  return (
    <form action={submitJudgment} className="space-y-3">
      <input type="hidden" name="itemId" value={itemId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Kind</label>
          <select name="kind" className="input" defaultValue="REVIEW">
            <option value="REVIEW">Review</option>
            <option value="SECOND_OPINION">Second opinion</option>
            <option value="QA_AUDIT">QA audit</option>
            <option value="ADJUDICATION">Adjudication</option>
            <option value="CLIENT">Client</option>
          </select>
        </div>
        <div>
          <label className="label">Decision</label>
          <select name="decision" className="input" defaultValue="APPROVED">
            <option value="APPROVED">Approve</option>
            <option value="REVISION_REQUESTED">Request revision</option>
            <option value="REJECTED">Reject</option>
            <option value="ESCALATED">Escalate</option>
          </select>
        </div>
        <div>
          <label className="label">Score (1–100)</label>
          <input name="score" type="number" min={1} max={100} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Defects (optional)</label>
        <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {DEFECT_OPTIONS.map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <input
                type="checkbox"
                name="defects"
                value={value}
                className="h-4 w-4 rounded border-gray-300 text-brand-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Comments</label>
        <textarea name="comments" rows={2} className="input" />
      </div>
      <SubmitButton className="btn-primary">Submit judgment</SubmitButton>
    </form>
  );
}
