import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, Section } from "@/components/app/ui";

export const dynamic = "force-dynamic";

export default async function TaskTypeDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const tt = await prisma.taskType.findUnique({
    where: { id },
    include: { fields: { orderBy: { order: "asc" } }, _count: { select: { tasks: true } } },
  });
  if (!tt) notFound();

  return (
    <div>
      <PageHeader
        title={tt.name}
        description={tt.description ?? undefined}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-sm text-gray-600">
        <span className="badge bg-gray-100 text-gray-600">{tt.category ?? "uncategorised"}</span>
        <span className="badge bg-gray-100 text-gray-600">{tt._count.tasks} tasks</span>
        {tt.requiredLevel && <span className="badge bg-gray-100 text-gray-600">level: {tt.requiredLevel}</span>}
        {tt.autoAssign && <span className="badge bg-emerald-100 text-emerald-700">auto-assign</span>}
        <span className={`badge ${tt.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
          {tt.isActive ? "active" : "inactive"}
        </span>
      </div>

      <Section title="Intake fields">
        {tt.fields.length === 0 ? (
          <p className="text-sm text-gray-400">No custom fields — requestors just provide a title and description.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400">
                <th className="py-2">Label</th>
                <th className="py-2">Key</th>
                <th className="py-2">Type</th>
                <th className="py-2">Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tt.fields.map((f) => (
                <tr key={f.id}>
                  <td className="py-2">{f.label}</td>
                  <td className="py-2 font-mono text-xs text-gray-500">{f.key}</td>
                  <td className="py-2">{f.kind}</td>
                  <td className="py-2">{f.required ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}
