import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { AssignForm } from "@/app/app/tasks/[id]/assign-form";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TriageQueue() {
  await requireAdmin();
  const [tasks, taskers, teams] = await Promise.all([
    prisma.task.findMany({
      where: { status: { in: ["SUBMITTED", "TRIAGE"] } },
      orderBy: { submittedAt: "asc" },
      include: { taskType: { select: { name: true } }, requestor: { select: { name: true } }, requiredSkills: true },
    }),
    prisma.user.findMany({ where: { taskerProfile: { isNot: null } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Triage queue" description="Assign incoming requests to taskers or teams." />
      {tasks.length === 0 ? (
        <EmptyState title="Queue is clear" description="No requests are waiting for assignment." />
      ) : (
        <div className="space-y-4">
          {tasks.map((t) => (
            <div key={t.id} className="card grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
              <div>
                <Link href={`/app/tasks/${t.id}`} className="font-medium hover:underline">{t.title}</Link>
                <div className="mt-1 text-xs text-gray-500">
                  {t.reference} · {t.taskType.name} · {t.priority} · by {t.requestor.name} · {relativeTime(t.submittedAt)}
                </div>
                {t.requiredLevel && (
                  <div className="mt-1 text-xs text-gray-500">Requires level: {t.requiredLevel}</div>
                )}
                {t.requiredSkills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.requiredSkills.map((s) => (
                      <span key={s.id} className="badge bg-gray-100 text-gray-600">{s.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                <AssignForm taskId={t.id} taskers={taskers} teams={teams} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
