import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Section } from "@/components/app/ui";
import { relativeTime } from "@/lib/utils";
import { AddItemsForm } from "./item-form";
import { CutReleaseForm } from "./release-form";
import { RecordEvalForm } from "./eval-form";
import type { GateResult } from "@/lib/release-gates";

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
      releases: {
        orderBy: { createdAt: "desc" },
        include: { evalRuns: { orderBy: { createdAt: "desc" } } },
      },
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

      <Section
        title="Releases"
        action={<CutReleaseForm batchId={batch.id} />}
      >
        {batch.releases.length === 0 ? (
          <p className="text-sm text-gray-400">
            No releases yet. Cutting a release evaluates the batch against the
            objective gates and records the result.
          </p>
        ) : (
          <ul className="space-y-3">
            {batch.releases.map((rel) => {
              const gates = (rel.gateResults ?? []) as unknown as GateResult[];
              return (
                <li
                  key={rel.id}
                  className="rounded-lg border border-gray-100 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{rel.version}</span>
                    <span
                      className={`badge ${
                        rel.status === "PASSED"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {rel.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {gates.map((g) => (
                      <span
                        key={g.key}
                        title={g.detail}
                        className={`badge ${
                          g.status === "pass"
                            ? "bg-green-50 text-green-700"
                            : g.status === "fail"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {g.status === "pass" ? "✓" : g.status === "fail" ? "✗" : "–"}{" "}
                        {g.label}
                      </span>
                    ))}
                  </div>
                  {rel.evalRuns.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rel.evalRuns.map((e) => {
                        const m = e.metrics as { lift?: number } | null;
                        const lift =
                          m && typeof m.lift === "number" ? m.lift : 0;
                        return (
                          <span
                            key={e.id}
                            className={`badge ${
                              lift >= 0
                                ? "bg-green-50 text-green-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {e.target} {lift >= 0 ? "+" : ""}
                            {(lift * 100).toFixed(1)}%
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <RecordEvalForm releaseId={rel.id} />
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={`Items (${batch._count.items})`}>
        {batch.items.length === 0 ? (
          <p className="text-sm text-gray-400">No items yet.</p>
        ) : (
          <ul className="space-y-2">
            {batch.items.map((it) => (
              <li key={it.id}>
                <Link
                  href={`/app/admin/batches/${batch.id}/items/${it.id}`}
                  className="block rounded-lg border border-gray-100 p-2 text-sm hover:bg-gray-50"
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
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
