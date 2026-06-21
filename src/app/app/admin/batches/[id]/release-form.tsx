"use client";

import { createRelease } from "@/server/releases";
import { SubmitButton } from "@/components/app/submit-button";

export function CutReleaseForm({ batchId }: { batchId: string }) {
  return (
    <form action={createRelease}>
      <input type="hidden" name="batchId" value={batchId} />
      <SubmitButton className="btn-secondary">Evaluate &amp; cut release</SubmitButton>
    </form>
  );
}
