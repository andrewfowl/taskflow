import Link from "next/link";
import type { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { TASK_STATUS_META } from "@/lib/constants";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COLUMNS: { title: string; statuses: TaskStatus[] }[] = [
  { title: "Intake", statuses: ["DRAFT", "SUBMITTED", "TRIAGE"] },
  { title: "Active", statuses: ["ASSIGNED", "IN_PROGRESS", "REVISION_REQUESTED", "ON_HOLD"] },
  { title: "Quality control", statuses: ["SUBMITTED_FOR_QC", "QC_IN_REVIEW", "SECOND_OPINION"] },
  { title: "Done", statuses: ["APPROVED", "DELIVERED"] },
];

export default async function PipelineBoard() {
  await requireAdmin();
  const tasks = await prisma.task.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { updatedAt: "desc" },
    include: { assignee: { select: { name: true } }, taskType: { select: { name: true } } },
    take: 300,
  });

  return (
    <div>
      <PageHeader title="Pipeline" description="Every active task across the operation, grouped by stage." />
      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => col.statuses.includes(t.status));
          return (
            <div key={col.title} className="rounded-xl bg-gray-100/60 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-gray-700">{col.title}</span>
                <span className="badge bg-white text-gray-500">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((t) => (
                  <Link key={t.id} href={`/app/tasks/${t.id}`} className="block rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {t.reference} · {t.taskType.name}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`badge ${TASK_STATUS_META[t.status].tone}`}>
                        {TASK_STATUS_META[t.status].label}
                      </span>
                      <span className="text-xs text-gray-400">{t.assignee?.name ?? "—"}</span>
                    </div>
                  </Link>
                ))}
                {items.length === 0 && <div className="px-1 py-6 text-center text-xs text-gray-400">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
