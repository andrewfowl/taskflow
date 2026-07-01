import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Section } from "@/components/app/ui";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/app/submit-button";
import { unmetDependencies, criticalPath } from "@/lib/dependencies";
import { removeTaskFromProject, removeDependency } from "@/server/projects";
import { AddTaskForm, AddDependencyForm } from "./project-controls";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { createdAt: "asc" },
        include: {
          dependencies: {
            include: {
              dependsOn: { select: { id: true, reference: true, status: true } },
            },
          },
        },
      },
    },
  });
  if (!project) notFound();

  const available = await prisma.task.findMany({
    where: { projectId: null },
    select: { id: true, reference: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const projectTasks = project.tasks.map((t) => ({
    id: t.id,
    reference: t.reference,
    title: t.title,
  }));
  const delivered = project.tasks.filter(
    (t) => t.status === "DELIVERED",
  ).length;
  const total = project.tasks.length;
  const pct = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const path = criticalPath(project.tasks);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/admin/projects"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Projects
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <span className="badge bg-gray-100 text-gray-600">{project.status}</span>
          <span className="text-sm text-gray-400">{project.reference}</span>
        </div>
        {project.description && (
          <p className="mt-1 text-sm text-gray-600">{project.description}</p>
        )}
      </div>

      <Section title="Rollup">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <div className="text-xs uppercase text-gray-400">Progress</div>
            <div className="text-lg font-semibold">
              {delivered}/{total} delivered · {pct}%
            </div>
            <div className="mt-1 h-2 w-48 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-brand-600"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase text-gray-400">Critical path</div>
            <div className="text-sm">
              {path.length > 0 ? path.join(" → ") : "—"}{" "}
              <span className="text-gray-400">
                ({path.length} task{path.length === 1 ? "" : "s"})
              </span>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title={`Tasks (${project.tasks.length})`}
        action={<AddTaskForm projectId={project.id} tasks={available} />}
      >
        {project.tasks.length === 0 ? (
          <p className="text-sm text-gray-400">No tasks in this project yet.</p>
        ) : (
          <ul className="space-y-2">
            {project.tasks.map((t) => {
              const unmet = unmetDependencies(t.dependencies);
              return (
                <li key={t.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/app/tasks/${t.id}`}
                        className="font-medium hover:underline"
                      >
                        {t.title}
                      </Link>{" "}
                      <span className="text-xs text-gray-400">{t.reference}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unmet.length > 0 && (
                        <span
                          title={`Blocked by ${unmet.join(", ")}`}
                          className="badge bg-rose-50 text-rose-700"
                        >
                          blocked
                        </span>
                      )}
                      <StatusBadge status={t.status} />
                      <form action={removeTaskFromProject}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <input type="hidden" name="taskId" value={t.id} />
                        <SubmitButton className="text-xs text-gray-400 hover:text-rose-600">
                          remove
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                  {t.dependencies.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500">
                      depends on:
                      {t.dependencies.map((d) => (
                        <span
                          key={d.id}
                          className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5"
                        >
                          {d.dependsOn.reference}
                          <form action={removeDependency} className="inline">
                            <input
                              type="hidden"
                              name="dependencyId"
                              value={d.id}
                            />
                            <input
                              type="hidden"
                              name="projectId"
                              value={project.id}
                            />
                            <button
                              type="submit"
                              className="text-gray-400 hover:text-rose-600"
                            >
                              ×
                            </button>
                          </form>
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {project.tasks.length >= 2 && (
        <Section title="Add dependency">
          <p className="mb-3 text-sm text-gray-500">
            Make one task wait until another is delivered.
          </p>
          <AddDependencyForm projectId={project.id} tasks={projectTasks} />
        </Section>
      )}
    </div>
  );
}
