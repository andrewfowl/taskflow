import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { StatusBadge } from "@/components/status-badge";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QcQueue() {
  await requireAdmin();
  const tasks = await prisma.task.findMany({
    where: { status: { in: ["SUBMITTED_FOR_QC", "QC_IN_REVIEW", "SECOND_OPINION", "APPROVED"] } },
    orderBy: { completedAt: "asc" },
    include: {
      taskType: { select: { name: true } },
      assignee: { select: { name: true } },
      _count: { select: { deliverables: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Quality control" description="Deliverables awaiting review, escalation, or release." />
      {tasks.length === 0 ? (
        <EmptyState title="Nothing in QC" description="Submitted deliverables will appear here for review." />
      ) : (
        <div className="card divide-y divide-gray-100">
          {tasks.map((t) => (
            <Link key={t.id} href={`/app/tasks/${t.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-gray-500">
                  {t.reference} · {t.taskType.name} · by {t.assignee?.name ?? "—"} · {t._count.deliverables} deliverable(s) · {relativeTime(t.completedAt)}
                </div>
              </div>
              <StatusBadge status={t.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
