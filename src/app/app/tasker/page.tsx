import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader, StatCard } from "@/components/app/ui";
import { TaskList } from "@/components/app/task-list";

export const dynamic = "force-dynamic";

export default async function TaskerWork() {
  const viewer = await requireViewer();

  // Tasks the viewer is doing: directly assigned, or via a team they're on.
  const teamIds = (
    await prisma.teamMembership.findMany({
      where: { userId: viewer.id },
      select: { teamId: true },
    })
  ).map((t) => t.teamId);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: viewer.id },
        teamIds.length ? { assignedTeamId: { in: teamIds } } : { id: "__none__" },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: { taskType: { select: { name: true } }, requestor: { select: { name: true } } },
    take: 100,
  });

  const active = tasks.filter((t) =>
    ["ASSIGNED", "IN_PROGRESS", "REVISION_REQUESTED", "SUBMITTED_FOR_QC", "QC_IN_REVIEW", "SECOND_OPINION"].includes(t.status),
  );
  const done = tasks.filter((t) => ["APPROVED", "DELIVERED"].includes(t.status));

  return (
    <div>
      <PageHeader title="My work" description="Tasks assigned to you or your teams." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active" value={active.length} />
        <StatCard label="Completed" value={done.length} />
        <StatCard label="Total" value={tasks.length} />
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Active</h2>
      <TaskList tasks={active} show={{ type: true, requestor: true }} />

      {done.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-sm font-semibold uppercase text-gray-500">Completed</h2>
          <TaskList tasks={done} show={{ type: true, requestor: true }} />
        </>
      )}
    </div>
  );
}
