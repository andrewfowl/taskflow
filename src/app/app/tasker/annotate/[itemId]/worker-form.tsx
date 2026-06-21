"use client";

import { submitAnnotation } from "@/server/annotations";
import { SubmitButton } from "@/components/app/submit-button";

export function WorkerAnnotateForm({ itemId }: { itemId: string }) {
  return (
    <form action={submitAnnotation} className="space-y-2">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="redirectTo" value="/app/tasker/annotate" />
      <label className="label">Your annotation (JSON)</label>
      <textarea
        name="data"
        rows={4}
        required
        className="input font-mono text-xs"
        placeholder='{"label": "A"}'
      />
      <SubmitButton className="btn-primary">Submit annotation</SubmitButton>
    </form>
  );
}
