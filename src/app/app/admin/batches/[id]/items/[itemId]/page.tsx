import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Section } from "@/components/app/ui";
import { relativeTime } from "@/lib/utils";
import { AnnotationForm, JudgmentForm } from "./work-forms";

export const dynamic = "force-dynamic";

export default async function ItemWork({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  await requireAdmin();
  const { id, itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      batch: { select: { id: true, reference: true, replicas: true } },
      annotations: {
        include: { worker: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      judgments: {
        include: { reviewer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!item || item.batch.id !== id) notFound();

  const agreement =
    item.agreementScore != null
      ? Math.round(item.agreementScore.toNumber() * 100)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/admin/batches/${item.batch.id}`}
          className="text-sm text-brand-600 hover:underline"
        >
          ← {item.batch.reference}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold">Item</h1>
          <span className="badge bg-gray-100 text-gray-700">{item.status}</span>
          {agreement != null && (
            <span className="badge bg-brand-50 text-brand-700">
              {agreement}% agreement
            </span>
          )}
          <span className="text-sm text-gray-400">
            {item.annotations.length}/{item.batch.replicas} annotations
          </span>
        </div>
      </div>

      <Section title="Input">
        <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
          {JSON.stringify(item.input, null, 2)}
        </pre>
      </Section>

      <Section title={`Annotations (${item.annotations.length})`}>
        <div className="mb-4">
          <AnnotationForm itemId={item.id} />
        </div>
        {item.annotations.length === 0 ? (
          <p className="text-sm text-gray-400">No annotations yet.</p>
        ) : (
          <ul className="space-y-2">
            {item.annotations.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-gray-100 p-2 text-sm"
              >
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{a.worker.name ?? "worker"}</span>
                  <span>{relativeTime(a.createdAt)}</span>
                </div>
                <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
                  {JSON.stringify(a.data, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Judgments (${item.judgments.length})`}>
        <div className="mb-4">
          <JudgmentForm itemId={item.id} />
        </div>
        {item.judgments.length === 0 ? (
          <p className="text-sm text-gray-400">No judgments yet.</p>
        ) : (
          <ul className="space-y-2">
            {item.judgments.map((j) => (
              <li
                key={j.id}
                className="rounded-lg border border-gray-100 p-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {j.kind} — {j.decision}
                    {j.score ? ` · ${j.score}/100` : ""}
                  </span>
                  <span className="text-xs text-gray-400">
                    {j.reviewer.name ?? "reviewer"} · {relativeTime(j.createdAt)}
                  </span>
                </div>
                {j.comments && <p className="mt-1 text-gray-600">{j.comments}</p>}
                {j.defects.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {j.defects.map((d) => (
                      <span
                        key={d}
                        className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700"
                      >
                        {d.replace(/_/g, " ").toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
