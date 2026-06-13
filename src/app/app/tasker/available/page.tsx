import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { StatusBadge } from "@/components/status-badge";
import { claimTask } from "@/server/assignment";
import { SubmitButton } from "@/components/app/submit-button";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AvailableTasks() {
  const viewer = await requireViewer();
  const profile = await prisma.taskerProfile.findUnique({ where: { userId: viewer.id } });

  const tasks = await prisma.task.findMany({
    where: { status: "TRIAGE", assigneeId: null },
    orderBy: { submittedAt: "asc" },
    include: { taskType: { select: { name: true } }, requiredSkills: true },
    take: 100,
  });

  if (!profile) {
    return (
      <div>
        <PageHeader title="Available tasks" />
        <EmptyState
          title="Enable tasker mode first"
          description="You need a tasker profile to claim work."
          action={<Link href="/app/tasker/profile" className="btn-primary">Set up profile</Link>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Available tasks" description="Open requests awaiting a tasker. Claim one to get started." />
      {tasks.length === 0 ? (
        <EmptyState title="Nothing open right now" description="Check back soon — new requests appear here." />
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="card flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <Link href={`/app/tasks/${t.id}`} className="font-medium hover:underline">
                  {t.title}
                </Link>
                <div className="mt-0.5 text-xs text-gray-500">
                  {t.reference} · {t.taskType.name} · {t.priority}
                  {t.requiredLevel ? ` · needs ${t.requiredLevel}` : ""} · {relativeTime(t.submittedAt)}
                </div>
                {t.requiredSkills.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.requiredSkills.map((s) => (
                      <span key={s.id} className="badge bg-gray-100 text-gray-600">{s.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={t.status} />
                <form action={claimTask}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <SubmitButton className="btn-primary">Claim</SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
