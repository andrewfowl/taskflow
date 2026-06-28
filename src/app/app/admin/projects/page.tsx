import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await requireAdmin();
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tasks: true } } },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Group related tasks and manage dependencies between them."
        action={
          <Link href="/app/admin/projects/new" className="btn-primary">
            New project
          </Link>
        }
      />
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="A project groups multiple tasks with dependencies between them."
          action={
            <Link href="/app/admin/projects/new" className="btn-primary">
              Create one
            </Link>
          }
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/app/admin/projects/${p.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">
                  {p.name} <span className="text-gray-400">· {p.reference}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {p._count.tasks} task(s) · {relativeTime(p.createdAt)}
                </div>
              </div>
              <span className="badge bg-gray-100 text-gray-600">{p.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
