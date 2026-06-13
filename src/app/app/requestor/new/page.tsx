import Link from "next/link";
import { prisma } from "@/lib/db";
import { getViewerContext } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { NewTaskForm } from "./new-task-form";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const ctx = await getViewerContext();
  const taskTypes = await prisma.taskType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { fields: { orderBy: { order: "asc" } } },
  });

  const serializable = taskTypes.map((tt) => ({
    id: tt.id,
    name: tt.name,
    description: tt.description,
    category: tt.category,
    fields: tt.fields.map((f) => ({
      id: f.id,
      label: f.label,
      key: f.key,
      kind: f.kind,
      required: f.required,
      helpText: f.helpText,
      options: Array.isArray(f.options) ? (f.options as string[]) : [],
      maxFiles: f.maxFiles,
      allowedMime: f.allowedMime,
    })),
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New request" description="Pick a task type and tell us what you need." />
      {taskTypes.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-600">
          No task types are configured yet. An administrator needs to{" "}
          <Link href="/app/admin/task-types" className="font-medium text-brand-600 hover:underline">
            create one
          </Link>
          .
        </div>
      ) : (
        <NewTaskForm taskTypes={serializable} entities={ctx?.entities ?? []} />
      )}
    </div>
  );
}
