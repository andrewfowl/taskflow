import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireViewer, getViewerContext } from "@/lib/session";
import { PageHeader, Section, StatCard } from "@/components/app/ui";
import { relativeTime } from "@/lib/utils";
import type { GateResult } from "@/lib/release-gates";

export const dynamic = "force-dynamic";

const CONTRACT_FIELDS: { key: string; label: string }[] = [
  { key: "useCase", label: "Use case" },
  { key: "unitOfWork", label: "Unit of work" },
  { key: "outputSchema", label: "Output schema" },
  { key: "rubric", label: "Grading rubric" },
  { key: "domainRules", label: "Domain rules" },
  { key: "edgeCases", label: "Edge cases" },
];

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// Buyer-facing quality receipt for a single commissioned batch. Read-only: it
// reuses the gate engine's stored results and the agreement/acceptance signals
// the production plane already computes, so the client can see *why* the data
// is trustworthy without touching the operator tooling.
export default async function RequestorBatchDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireViewer();
  const { id } = await params;
  const ctx = await getViewerContext();
  const entityIds = (ctx?.entities ?? []).map((e) => e.id);

  // Scope strictly to the viewer's own organisations — a buyer only ever sees
  // batches their entity commissioned.
  const batch = entityIds.length
    ? await prisma.batch.findFirst({
        where: { id, entityId: { in: entityIds } },
        include: {
          rubricVersion: true,
          entity: { select: { name: true } },
          releases: {
            orderBy: { createdAt: "desc" },
            include: { evalRuns: { orderBy: { createdAt: "desc" } } },
          },
        },
      })
    : null;
  if (!batch) notFound();

  const [statusGroups, agg, total] = await Promise.all([
    prisma.item.groupBy({
      by: ["status"],
      where: { batchId: batch.id },
      _count: { _all: true },
    }),
    prisma.item.aggregate({
      where: { batchId: batch.id, agreementScore: { not: null } },
      _avg: { agreementScore: true },
    }),
    prisma.item.count({ where: { batchId: batch.id } }),
  ]);

  const delivered = statusGroups
    .filter((g) => g.status === "ACCEPTED" || g.status === "RELEASED")
    .reduce((s, g) => s + g._count._all, 0);
  const acceptanceRate = total > 0 ? delivered / total : 0;
  const avgAgreement = agg._avg.agreementScore
    ? Number(agg._avg.agreementScore)
    : null;

  const contract = (batch.rubricVersion.contract ?? {}) as Record<
    string,
    unknown
  >;
  const contractRows = CONTRACT_FIELDS.map((f) => ({
    label: f.label,
    value: contract[f.key],
  })).filter(
    (r): r is { label: string; value: string } =>
      typeof r.value === "string" && r.value.trim().length > 0,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/requestor/batches"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Data batches
        </Link>
        <PageHeader
          title={batch.reference}
          description={`${batch.rubricVersion.rubricId}@${batch.rubricVersion.version} · ${batch.kind} · ${batch.entity?.name ?? ""}`}
          action={
            <span className="badge bg-gray-100 text-gray-700">
              {batch.status}
            </span>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Items delivered"
          value={`${delivered}/${total}`}
          hint={
            batch.targetCount ? `${batch.targetCount} target` : "no target set"
          }
        />
        <StatCard
          label="Acceptance rate"
          value={total > 0 ? pct(acceptanceRate) : "—"}
          hint={
            batch.acceptanceThreshold
              ? `threshold ${pct(Number(batch.acceptanceThreshold))}`
              : "no threshold"
          }
        />
        <StatCard
          label="Annotator agreement"
          value={avgAgreement !== null ? pct(avgAgreement) : "—"}
          hint="mean across scored items"
        />
        <StatCard
          label="Independent reviews"
          value={`K=${batch.replicas}`}
          hint="per item"
        />
      </div>

      {contractRows.length > 0 && (
        <Section title="Data contract">
          <p className="mb-3 text-sm text-gray-500">
            The specification this dataset was produced and graded against.
          </p>
          <dl className="grid gap-4 sm:grid-cols-2">
            {contractRows.map((r) => (
              <div key={r.label}>
                <dt className="text-xs font-medium uppercase text-gray-400">
                  {r.label}
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-800">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      <Section title="Releases & quality gates">
        {batch.releases.length === 0 ? (
          <p className="text-sm text-gray-400">
            No releases cut yet. A release evaluates the batch against the
            objective quality gates and opens a sign-off window.
          </p>
        ) : (
          <ul className="space-y-3">
            {batch.releases.map((rel) => {
              const gates = (rel.gateResults ?? []) as unknown as GateResult[];
              const card = (rel.datasetCard ?? {}) as Record<string, unknown>;
              return (
                <li
                  key={rel.id}
                  className="rounded-lg border border-gray-100 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{rel.version}</span>
                    <span
                      className={`badge ${
                        rel.status === "PASSED" || rel.status === "EXPORTED"
                          ? "bg-green-100 text-green-800"
                          : rel.status === "FAILED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {rel.status}
                    </span>
                  </div>

                  {gates.length > 0 && (
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
                          {g.status === "pass"
                            ? "✓"
                            : g.status === "fail"
                              ? "✗"
                              : "–"}{" "}
                          {g.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {rel.evalRuns.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium uppercase text-gray-400">
                        Model impact
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
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
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-500">
                    {rel.clientStatus === "PENDING" ? (
                      <>
                        Awaiting your sign-off
                        {rel.clientSlaAt
                          ? ` · auto-accepts ${rel.clientSlaAt.toLocaleDateString()}`
                          : ""}
                      </>
                    ) : (
                      <>
                        Client {rel.clientStatus.toLowerCase()}
                        {rel.clientDecidedAt
                          ? ` · ${relativeTime(rel.clientDecidedAt)}`
                          : ""}
                      </>
                    )}
                  </div>

                  {typeof card.generatedAt === "string" && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-brand-600 hover:underline">
                        Dataset card
                      </summary>
                      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                        {typeof card.name === "string" && (
                          <CardRow label="Name" value={card.name} />
                        )}
                        {typeof card.rubricVersion === "string" && (
                          <CardRow
                            label="Rubric version"
                            value={card.rubricVersion}
                          />
                        )}
                        {typeof card.kind === "string" && (
                          <CardRow label="Kind" value={card.kind} />
                        )}
                        {typeof card.replicas === "number" && (
                          <CardRow
                            label="Replicas (K)"
                            value={String(card.replicas)}
                          />
                        )}
                        {typeof card.itemCount === "number" && (
                          <CardRow
                            label="Items at cut"
                            value={String(card.itemCount)}
                          />
                        )}
                        <CardRow
                          label="Generated"
                          value={new Date(
                            card.generatedAt,
                          ).toLocaleString()}
                        />
                      </dl>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function CardRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-800">{value}</dd>
    </div>
  );
}
