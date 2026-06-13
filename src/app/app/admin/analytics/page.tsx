import type { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, StatCard, Section } from "@/components/app/ui";
import { TASK_STATUS_META } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdmin();

  const [total, byStatusRaw, delivered, payoutAgg, usageAgg] = await Promise.all([
    prisma.task.count(),
    prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.task.findMany({
      where: { status: "DELIVERED", submittedAt: { not: null }, deliveredAt: { not: null } },
      select: {
        id: true,
        submittedAt: true,
        deliveredAt: true,
        budgetAmount: true,
        timeEntries: { select: { costAmount: true, minutes: true } },
      },
      take: 500,
    }),
    prisma.payout.aggregate({ _sum: { grossAmount: true, commissionAmount: true, netAmount: true } }),
    prisma.usageRecord.aggregate({ _sum: { units: true } }),
  ]);

  // Average cycle time (days) and on-budget rate.
  let cycleDaysTotal = 0;
  let onBudget = 0;
  let withBudget = 0;
  for (const t of delivered) {
    const ms = (t.deliveredAt!.getTime() - t.submittedAt!.getTime());
    cycleDaysTotal += ms / 86_400_000;
    const actual = t.timeEntries.reduce((s, e) => s + Number(e.costAmount ?? 0), 0);
    if (t.budgetAmount) {
      withBudget++;
      if (actual <= Number(t.budgetAmount)) onBudget++;
    }
  }
  const avgCycle = delivered.length ? (cycleDaysTotal / delivered.length).toFixed(1) : "—";
  const onBudgetPct = withBudget ? Math.round((onBudget / withBudget) * 100) : null;

  const byStatus = new Map<TaskStatus, number>();
  for (const row of byStatusRaw) byStatus.set(row.status, row._count._all);

  return (
    <div>
      <PageHeader title="Analytics" description="Throughput, cycle time, and plan-vs-actual across the pipeline." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total tasks" value={total} />
        <StatCard label="Delivered" value={delivered.length} />
        <StatCard label="Avg cycle time" value={`${avgCycle} d`} hint="submit → deliver" />
        <StatCard label="On-budget rate" value={onBudgetPct === null ? "—" : `${onBudgetPct}%`} hint="actual ≤ budget" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Tasks by status">
          <ul className="space-y-2">
            {([...byStatus.entries()] as [TaskStatus, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <li key={status} className="flex items-center justify-between">
                  <span className={`badge ${TASK_STATUS_META[status].tone}`}>{TASK_STATUS_META[status].label}</span>
                  <span className="text-sm font-medium">{count}</span>
                </li>
              ))}
            {byStatus.size === 0 && <li className="text-sm text-gray-400">No data yet.</li>}
          </ul>
        </Section>

        <Section title="Financials">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Tasker payouts (gross)</dt>
              <dd className="font-medium">{formatCurrency(Number(payoutAgg._sum.grossAmount ?? 0))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Platform commission</dt>
              <dd className="font-medium text-emerald-700">{formatCurrency(Number(payoutAgg._sum.commissionAmount ?? 0))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Net to taskers</dt>
              <dd className="font-medium">{formatCurrency(Number(payoutAgg._sum.netAmount ?? 0))}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3">
              <dt className="text-gray-500">Billable task submissions</dt>
              <dd className="font-medium">{usageAgg._sum.units ?? 0}</dd>
            </div>
          </dl>
        </Section>
      </div>
    </div>
  );
}
