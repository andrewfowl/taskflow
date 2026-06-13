import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { getViewerContext } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { TaskList } from "@/components/app/task-list";

export const dynamic = "force-dynamic";

export default async function RequestorTasks() {
  const viewer = await requireViewer();
  const ctx = await getViewerContext();

  // A requestor sees their own tasks. Entity managers also see every task in
  // entities they manage.
  const managedEntityIds = (ctx?.entities ?? [])
    .filter((e) => e.isManager)
    .map((e) => e.id);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { requestorId: viewer.id },
        managedEntityIds.length ? { entityId: { in: managedEntityIds } } : { id: "__none__" },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: { taskType: { select: { name: true } }, assignee: { select: { name: true } } },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="My requests"
        description="Tasks you've submitted, plus any in organisations you manage."
        action={
          <Link href="/app/requestor/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New request
          </Link>
        }
      />
      <TaskList tasks={tasks} show={{ type: true, assignee: true }} />
    </div>
  );
}
