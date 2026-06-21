import Link from "next/link";
import type { DefectCode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, StatCard, Section } from "@/components/app/ui";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Configurable cost per unit of human effort (one annotation or one judgment).
const UNIT_COST = 5;
const CRITICAL_DEFECTS: DefectCode[] = [
  "SAFETY_MISS",
  "FACTUAL_ERROR",
  "HALLUCINATED_CITATION",
];

export default async function DataMetrics() {
  await requireAdmin();

  const [
    batches,
    itemsByStatus,
    acceptedByBatch,
    agreementByBatch,
    totalItems,
    totalAnnotations,
    totalJudgments,
    criticalJudgments,
    agg,
  ] = await Promise.all([
    prisma.batch.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        _count: { select: { items: true } },
        rubricVersion: { select: { rubricId: true } },
      },
    }),
    prisma.item.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.item.groupBy({
      by: ["batchId"],
      where: { status: { in: ["ACCEPTED", "RELEASED"] } },
      _count: { _all: true },
    }),
    prisma.item.groupBy({ by: ["batchId"], _avg: { agreementScore: true } }),
    prisma.item.count(),
    prisma.annotation.count(),
    prisma.judgment.count(),
    prisma.judgment.count({ where: { defects: { hasSome: CRITICAL_DEFECTS } } }),
    prisma.item.aggregate({ _avg: { agreementScore: true } }),
  ]);

  const accepted = itemsByStatus
    .filter((s) => s.status === "ACCEPTED" || s.status === "RELEASED")
    .reduce((n, s) => n + s._count._all, 0);
  const rejected =
    itemsByStatus.find((s) => s.status === "REJECTED")?._count._all ?? 0;

  // Cost per *accepted* item exposes rework: effort spent ÷ items that landed.
  const effort = totalAnnotations + totalJudgments;
  const totalCost = effort * UNIT_COST;
  const costPerAccepted = accepted > 0 ? totalCost / accepted : null;
  const costPerGenerated = totalItems > 0 ? totalCost / totalItems : null;
  const acceptanceRate = totalItems > 0 ? accepted / totalItems : 0;
  const avgAgreement =
    agg._avg.agreementScore != null ? Number(agg._avg.agreementScore) : null;
  const criticalRate =
    totalJudgments > 0 ? criticalJudgments / totalJudgments : 0;

  const acceptedMap = new Map(
    acceptedByBatch.map((r) => [r.batchId, r._count._all]),
  );
  const agreementMap = new Map(
    agreementByBatch.map((r) => [
      r.batchId,
      r._avg.agreementScore != null ? Number(r._avg.agreementScore) : null,
    ]),
  );

  return (
    <div>
      <PageHeader
        title="Data control panel"
        description="Quality, throughput, and cost across data-production batches."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Batches" value={batches.length} />
        <StatCard
          label="Items"
          value={totalItems}
          hint={`${accepted} accepted · ${rejected} rejected`}
        />
        <StatCard
          label="Acceptance rate"
          value={`${Math.round(acceptanceRate * 100)}%`}
        />
        <StatCard
          label="Avg agreement"
          value={
            avgAgreement != null ? `${Math.round(avgAgreement * 100)}%` : "—"
          }
        />
        <StatCard label="Annotations" value={totalAnnotations} />
        <StatCard
          label="Judgments"
          value={totalJudgments}
          hint={`${Math.round(criticalRate * 100)}% with critical defects`}
        />
        <StatCard
          label="Cost / accepted item"
          value={
            costPerAccepted != null
              ? formatCurrency(costPerAccepted, "USD")
              : "—"
          }
          hint={
            costPerGenerated != null
              ? `vs ${formatCurrency(costPerGenerated, "USD")} / generated`
              : undefined
          }
        />
        <StatCard
          label="Effort cost"
          value={formatCurrency(totalCost, "USD")}
          hint={`${effort} units @ $${UNIT_COST}`}
        />
      </div>

      <div className="mt-6">
        <Section title="By batch">
          {batches.length === 0 ? (
            <p className="text-sm text-gray-400">No batches yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-400">
                    <th className="py-2 font-medium">Batch</th>
                    <th className="font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Items</th>
                    <th className="text-right font-medium">Accepted</th>
                    <th className="text-right font-medium">Accept %</th>
                    <th className="text-right font-medium">Agreement</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => {
                    const items = b._count.items;
                    const acc = acceptedMap.get(b.id) ?? 0;
                    const agr = agreementMap.get(b.id);
                    return (
                      <tr key={b.id} className="border-t border-gray-100">
                        <td className="py-2">
                          <Link
                            href={`/app/admin/batches/${b.id}`}
                            className="font-medium text-brand-600 hover:underline"
                          >
                            {b.reference}
                          </Link>{" "}
                          <span className="text-gray-400">
                            {b.rubricVersion.rubricId}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-gray-100 text-gray-600">
                            {b.status}
                          </span>
                        </td>
                        <td className="text-right">{items}</td>
                        <td className="text-right">{acc}</td>
                        <td className="text-right">
                          {items > 0 ? Math.round((acc / items) * 100) : 0}%
                        </td>
                        <td className="text-right">
                          {agr != null ? `${Math.round(agr * 100)}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
