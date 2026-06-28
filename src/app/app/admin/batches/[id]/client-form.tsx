"use client";

import type { ReactNode } from "react";
import { decideClientAcceptance } from "@/server/releases";
import { SubmitButton } from "@/components/app/submit-button";

export function ClientDecisionForm({
  releaseId,
  decision,
  className,
  children,
}: {
  releaseId: string;
  decision: "ACCEPTED" | "REJECTED";
  className?: string;
  children: ReactNode;
}) {
  return (
    <form action={decideClientAcceptance}>
      <input type="hidden" name="releaseId" value={releaseId} />
      <input type="hidden" name="decision" value={decision} />
      <SubmitButton className={className ?? "btn-secondary"}>
        {children}
      </SubmitButton>
    </form>
  );
}
