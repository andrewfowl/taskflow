"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(className)}>
      {pending ? pendingText ?? "Working…" : children}
    </button>
  );
}
