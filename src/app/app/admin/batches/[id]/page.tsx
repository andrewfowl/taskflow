import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Section } from "@/components/app/ui";
import { relativeTime } from "@/lib/utils";
import { AddItemsForm } from "./item-form";

export const dynamic = "force-dynamic";

export default async function BatchDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      rubricVersion: true,
      _count: { select: { items: true } },
      items: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!batch) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{batch.reference}</h1>
          <span className="badge bg-gray-100 text-gray-700">{batch.status}</span>
        </div>
        <div className="mt-1 text-sm text-gray-500">
          {batch.rubricVersion.rubricId}@{batch.rubricVersion.version} ·{" "}
          {batch.kind} · K={batch.replicas} · {batch._count.items} item(s)
          {batch.targetCount ? ` / ${batch.targetCount} target` : ""}
        </div>
      </div>

      <Section title="Ingest items">
        <p className="mb-3 text-sm text-gray-500">
          Paste a JSON array or newline-delimited JSON objects. Each row becomes
          an item awaiting annotation.
        </p>
        <AddItemsForm batchId={batch.id} />
      </Section>

      <Section title={`Items (${batch._count.items})`}>
        {batch.items.length === 0 ? (
          <p className="text-sm text-gray-400">No items yet.</p>
        ) : (
          <ul className="space-y-2">
            {batch.items.map((it) => (
              <li
                key={it.id}
                className="rounded-lg border border-gray-100 p-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="badge bg-gray-100 text-gray-600">
                    {it.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {relativeTime(it.createdAt)}
                  </span>
                </div>
                <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
                  {JSON.stringify(it.input, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
