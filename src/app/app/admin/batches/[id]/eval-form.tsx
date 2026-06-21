"use client";

import { recordEvalRun } from "@/server/evals";
import { SubmitButton } from "@/components/app/submit-button";

export function RecordEvalForm({ releaseId }: { releaseId: string }) {
  return (
    <form action={recordEvalRun} className="mt-2 flex flex-wrap items-end gap-2">
      <input type="hidden" name="releaseId" value={releaseId} />
      <div>
        <label className="label">Eval target</label>
        <input
          name="target"
          required
          className="input w-44"
          placeholder="model / suite"
        />
      </div>
      <div>
        <label className="label">Lift (e.g. 0.03)</label>
        <input
          name="lift"
          type="number"
          step="any"
          className="input w-28"
          placeholder="0.00"
        />
      </div>
      <SubmitButton className="btn-secondary">Record eval</SubmitButton>
    </form>
  );
}
