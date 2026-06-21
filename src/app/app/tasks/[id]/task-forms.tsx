"use client";

import { useTransition } from "react";
import type { TaskStatus } from "@prisma/client";
import { changeStatus, addComment } from "@/server/tasks";
import { submitPlan, decidePlan } from "@/server/plans";
import { logTime, submitDeliverable } from "@/server/work";
import { startQc, submitQcReview, submitSecondOpinion, deliverTask } from "@/server/qc";
import { addMethodologyEntry } from "@/server/methodologies";
import { SubmitButton } from "@/components/app/submit-button";

// ── Status transitions (positional server actions, called from handlers) ─────

export function StatusButton({
  taskId,
  next,
  label,
  className = "btn-secondary",
}: {
  taskId: string;
  next: TaskStatus;
  label: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => start(() => changeStatus(taskId, next))}
    >
      {pending ? "…" : label}
    </button>
  );
}

export function StartQcButton({ taskId }: { taskId: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className="btn-primary" onClick={() => start(() => startQc(taskId))}>
      {pending ? "…" : "Start QC review"}
    </button>
  );
}

export function DeliverButton({ taskId }: { taskId: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className="btn-primary" onClick={() => start(() => deliverTask(taskId))}>
      {pending ? "Delivering…" : "Deliver to requestor"}
    </button>
  );
}

// ── Plans ────────────────────────────────────────────────────────────────────

export function ProposePlanForm({ taskId }: { taskId: string }) {
  return (
    <form action={submitPlan} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Pricing</label>
          <select name="pricingModel" className="input" defaultValue="FIXED">
            <option value="FIXED">Fixed price</option>
            <option value="HOURLY">Hourly</option>
          </select>
        </div>
        <div>
          <label className="label">Estimated hours</label>
          <input name="estimatedHours" type="number" step="any" className="input" />
        </div>
        <div>
          <label className="label">Hourly rate</label>
          <input name="hourlyRate" type="number" step="any" className="input" placeholder="for hourly" />
        </div>
        <div>
          <label className="label">Fixed price</label>
          <input name="fixedPrice" type="number" step="any" className="input" placeholder="for fixed" />
        </div>
      </div>
      <div>
        <label className="label">Summary</label>
        <textarea name="summary" rows={2} className="input" placeholder="What's included" />
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="mb-2 text-xs font-medium uppercase text-gray-400">Milestones (optional)</div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-2 grid grid-cols-[1fr_90px_70px] gap-2">
            <input name="milestoneTitle" className="input" placeholder={`Milestone ${i + 1}`} />
            <input name="milestoneAmount" type="number" step="any" className="input" placeholder="$" />
            <input name="milestoneHours" type="number" step="any" className="input" placeholder="hrs" />
          </div>
        ))}
      </div>
      <SubmitButton className="btn-primary">Submit plan</SubmitButton>
    </form>
  );
}

export function DecidePlanButtons({ planId }: { planId: string }) {
  return (
    <div className="flex gap-2">
      <form action={decidePlan}>
        <input type="hidden" name="planId" value={planId} />
        <input type="hidden" name="decision" value="approve" />
        <SubmitButton className="btn-primary">Approve plan</SubmitButton>
      </form>
      <form action={decidePlan}>
        <input type="hidden" name="planId" value={planId} />
        <input type="hidden" name="decision" value="reject" />
        <SubmitButton className="btn-secondary">Reject</SubmitButton>
      </form>
    </div>
  );
}

// ── Time & deliverables ──────────────────────────────────────────────────────

export function LogTimeForm({ taskId }: { taskId: string }) {
  return (
    <form action={logTime} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <div>
        <label className="label">Minutes</label>
        <input name="minutes" type="number" min={1} className="input w-28" required />
      </div>
      <div className="flex-1">
        <label className="label">Note</label>
        <input name="description" className="input" placeholder="What you worked on" />
      </div>
      <div>
        <label className="label">Cost ($)</label>
        <input name="costAmount" type="number" step="any" className="input w-28" placeholder="auto" />
      </div>
      <SubmitButton className="btn-secondary">Log time</SubmitButton>
    </form>
  );
}

export function SubmitDeliverableForm({ taskId }: { taskId: string }) {
  return (
    <form action={submitDeliverable} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      <div>
        <label className="label">Title</label>
        <input name="title" className="input" placeholder="Deliverable name" />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea name="notes" rows={2} className="input" />
      </div>
      <div>
        <label className="label">Files</label>
        <input name="files" type="file" multiple className="input" required />
      </div>
      <SubmitButton className="btn-primary">Submit for QC</SubmitButton>
    </form>
  );
}

// ── Quality control ──────────────────────────────────────────────────────────

// Defect taxonomy options (mirror of the Prisma DefectCode enum) with
// human-readable labels. See docs/data-production.md §5.
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

export function QcReviewForm({ taskId, deliverableId }: { taskId: string; deliverableId?: string }) {
  return (
    <form action={submitQcReview} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      {deliverableId && <input type="hidden" name="deliverableId" value={deliverableId} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Decision</label>
          <select name="decision" className="input" defaultValue="APPROVED">
            <option value="APPROVED">Approve</option>
            <option value="REVISION_REQUESTED">Request revision</option>
            <option value="ESCALATED">Escalate for second opinion</option>
          </select>
        </div>
        <div>
          <label className="label">Quality score (1–100)</label>
          <input name="score" type="number" min={1} max={100} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Defects (optional)</label>
        <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {DEFECT_OPTIONS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm text-gray-600">
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
      <SubmitButton className="btn-primary">Submit review</SubmitButton>
    </form>
  );
}

export function SecondOpinionForm({ taskId, parentReviewId }: { taskId: string; parentReviewId?: string }) {
  return (
    <form action={submitSecondOpinion} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      {parentReviewId && <input type="hidden" name="parentReviewId" value={parentReviewId} />}
      <div>
        <label className="label">Second-opinion decision</label>
        <select name="decision" className="input" defaultValue="approve">
          <option value="approve">Approve</option>
          <option value="revision">Request revision</option>
        </select>
      </div>
      <div>
        <label className="label">Comments</label>
        <textarea name="comments" rows={2} className="input" />
      </div>
      <SubmitButton className="btn-primary">Submit second opinion</SubmitButton>
    </form>
  );
}

// ── Comments & methodology entries ───────────────────────────────────────────

export function CommentForm({ taskId, canChooseVisibility }: { taskId: string; canChooseVisibility: boolean }) {
  return (
    <form action={addComment} className="space-y-2">
      <input type="hidden" name="taskId" value={taskId} />
      <textarea name="body" rows={2} className="input" placeholder="Add a comment…" required />
      <div className="flex items-center justify-between">
        {canChooseVisibility ? (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" name="clientVisible" /> Visible to requestor
          </label>
        ) : (
          <span />
        )}
        <SubmitButton className="btn-secondary">Comment</SubmitButton>
      </div>
    </form>
  );
}

export function AddMethodologyEntryForm({
  taskId,
  methodologies,
}: {
  taskId: string;
  methodologies: { id: string; name: string }[];
}) {
  if (methodologies.length === 0) return null;
  return (
    <form action={addMethodologyEntry} className="space-y-2">
      <input type="hidden" name="taskId" value={taskId} />
      <select name="methodologyId" className="input">
        {methodologies.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      <textarea
        name="data"
        rows={3}
        className="input font-mono text-xs"
        placeholder='{"approach": "…", "findings": "…"}'
        defaultValue="{}"
      />
      <SubmitButton className="btn-secondary">Save documentation</SubmitButton>
    </form>
  );
}
