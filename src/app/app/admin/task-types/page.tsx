import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { toggleTaskType } from "@/server/task-types";
import { SubmitButton } from "@/components/app/submit-button";

export const dynamic = "force-dynamic";

export default async function TaskTypesPage() {
  await requireAdmin();
  const types = await prisma.taskType.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { fields: true, tasks: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Task types"
        description="Define the kinds of work the platform accepts and their intake forms."
        action={
          <Link href="/app/admin/task-types/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New task type
          </Link>
        }
      />
      {types.length === 0 ? (
        <EmptyState
          title="No task types yet"
          description="Create the first task type so requestors can submit work."
          action={<Link href="/app/admin/task-types/new" className="btn-primary">Create one</Link>}
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {types.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <Link href={`/app/admin/task-types/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                <div className="text-xs text-gray-500">
                  {t.category ? `${t.category} · ` : ""}{t._count.fields} field(s) · {t._count.tasks} task(s)
                  {t.autoAssign ? " · auto-assign" : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${t.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {t.isActive ? "active" : "inactive"}
                </span>
                <form action={toggleTaskType}>
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitButton className="btn-ghost text-sm">{t.isActive ? "Disable" : "Enable"}</SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
