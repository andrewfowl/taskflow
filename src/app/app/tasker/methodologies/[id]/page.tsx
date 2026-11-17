import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader, Section } from "@/components/app/ui";
import { relativeTime } from "@/lib/utils";
import { fieldTypeLabel, parseSchema } from "@/lib/methodology-schema";
import { EntryView } from "@/components/app/methodology-entry-view";

export const dynamic = "force-dynamic";

export default async function MethodologyDetail({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const m = await prisma.methodology.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      taskType: { select: { name: true } },
      team: { select: { name: true } },
      entries: {
        include: { task: { select: { id: true, reference: true } }, author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!m) notFound();

  const schema = parseSchema(m.schema);
  const isOwner = m.ownerId === viewer.id;

  return (
    <div>
      <PageHeader
        title={m.name}
        description={m.description ?? undefined}
        action={
          isOwner ? (
            <Link href={`/app/tasker/methodologies/${m.id}/edit`} className="btn-secondary">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          ) : undefined
        }
      />
      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        <span className="badge bg-gray-100 text-gray-700">{m.taskType ? m.taskType.name : "Any task type"}</span>
        <span className="badge bg-gray-100 text-gray-700">{m.team ? `Team: ${m.team.name}` : `Owner: ${m.owner.name}`}</span>
        <span className={m.isPublished ? "badge bg-green-50 text-green-700" : "badge bg-gray-100 text-gray-500"}>
          {m.isPublished ? "Published" : "Private"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Structure">
          <ol className="space-y-4">
            {schema.sections.map((section) => (
              <li key={section.key}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                  {section.repeatable && (
                    <span className="badge bg-brand-50 text-brand-700">Repeatable{section.itemLabel ? ` · per ${section.itemLabel.toLowerCase()}` : ""}</span>
                  )}
                </div>
                {section.description && <p className="mt-0.5 text-xs text-gray-500">{section.description}</p>}
                <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {section.fields.map((f) => (
                    <li key={f.key} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <span className="text-gray-900">{f.label}</span>
                        {f.required && <span className="ml-1 text-red-600" aria-label="required">*</span>}
                        {f.options && f.options.length > 0 && (
                          <div className="mt-0.5 truncate text-xs text-gray-500">{f.options.join(" · ")}</div>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-gray-500">{fieldTypeLabel(f.type)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Section>
        <Section title={`Entries (${m.entries.length})`}>
          {m.entries.length === 0 ? (
            <p className="text-sm text-gray-400">
              No documentation captured yet. Open a task you&apos;re working on and use &quot;Work documentation&quot;.
            </p>
          ) : (
            <ul className="space-y-3">
              {m.entries.map((e) => (
                <li key={e.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Link href={`/app/tasks/${e.task.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                      Task {e.task.reference}
                    </Link>
                    <span className="text-xs text-gray-400">{e.author.name} · {relativeTime(e.createdAt)}</span>
                  </div>
                  <EntryView schema={schema} data={e.data} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
