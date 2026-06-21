"use client";

import { addItems } from "@/server/batches";
import { SubmitButton } from "@/components/app/submit-button";

export function AddItemsForm({ batchId }: { batchId: string }) {
  return (
    <form action={addItems} className="space-y-3">
      <input type="hidden" name="batchId" value={batchId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div>
          <label className="label">Items (JSON)</label>
          <textarea
            name="items"
            rows={5}
            required
            className="input font-mono text-xs"
            placeholder={'{"prompt": "…"}\n{"prompt": "…"}'}
          />
        </div>
        <div>
          <label className="label">Schema version</label>
          <input name="schemaVersion" className="input" defaultValue="v1" />
        </div>
      </div>
      <SubmitButton className="btn-primary">Add items</SubmitButton>
    </form>
  );
}
