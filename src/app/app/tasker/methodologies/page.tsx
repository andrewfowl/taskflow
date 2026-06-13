import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/app/ui";

export const dynamic = "force-dynamic";

export default async function MethodologiesPage() {
  const viewer = await requireViewer();
  const methodologies = await prisma.methodology.findMany({
    where: { OR: [{ ownerId: viewer.id }, { isPublished: true }] },
    include: { taskType: { select: { name: true } }, _count: { select: { entries: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Methodologies"
        description="Reusable templates for documenting how you perform a class of work."
        action={
          <Link href="/app/tasker/methodologies/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New methodology
          </Link>
        }
      />
      {methodologies.length === 0 ? (
        <EmptyState
          title="No methodologies yet"
          description="Create a structured interface to document your work consistently across tasks."
          action={<Link href="/app/tasker/methodologies/new" className="btn-primary">Create one</Link>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {methodologies.map((m) => (
            <Link key={m.id} href={`/app/tasker/methodologies/${m.id}`} className="card p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="font-medium">{m.name}</div>
                {m.isPublished && <span className="badge bg-emerald-100 text-emerald-700">published</span>}
              </div>
              {m.description && <p className="mt-1 text-sm text-gray-600">{m.description}</p>}
              <div className="mt-2 text-xs text-gray-400">
                {m.taskType ? `${m.taskType.name} · ` : ""}{m._count.entries} entr{m._count.entries === 1 ? "y" : "ies"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
