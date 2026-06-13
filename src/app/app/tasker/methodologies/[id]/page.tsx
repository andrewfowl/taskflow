import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader, Section } from "@/components/app/ui";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MethodologyDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer();
  const { id } = await params;
  const m = await prisma.methodology.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      taskType: { select: { name: true } },
      entries: { include: { task: { select: { reference: true } }, author: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!m) notFound();

  return (
    <div>
      <PageHeader title={m.name} description={m.description ?? undefined} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Schema">
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
            {JSON.stringify(m.schema, null, 2)}
          </pre>
          <div className="mt-3 text-xs text-gray-500">
            {m.taskType ? `Task type: ${m.taskType.name} · ` : ""}Owner: {m.owner.name}
            {m.isPublished ? " · published" : ""}
          </div>
        </Section>
        <Section title={`Entries (${m.entries.length})`}>
          {m.entries.length === 0 ? (
            <p className="text-sm text-gray-400">No documentation captured with this methodology yet.</p>
          ) : (
            <ul className="space-y-2">
              {m.entries.map((e) => (
                <li key={e.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="text-sm font-medium">Task {e.task.reference}</div>
                  <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
                    {JSON.stringify(e.data, null, 2)}
                  </pre>
                  <div className="text-xs text-gray-400">{e.author.name} · {relativeTime(e.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
