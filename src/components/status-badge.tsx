import type { TaskStatus } from "@prisma/client";
import { TASK_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status];
  return <span className={cn("badge", meta.tone)}>{meta.label}</span>;
}

export function Pill({
  children,
  tone = "bg-gray-100 text-gray-700",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={cn("badge", tone)}>{children}</span>;
}
