import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, StatCard, EmptyState } from "@/components/app/ui";
import { markPayoutPaid } from "@/server/payouts";
import { SubmitButton } from "@/components/app/submit-button";
import { formatCurrency, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  await requireAdmin();
  const payouts = await prisma.payout.findMany({
    include: {
      tasker: { select: { name: true, email: true } },
      task: { select: { id: true, reference: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = payouts.filter((p) => p.status !== "PAID");
  const commission = payouts.reduce((s, p) => s + Number(p.commissionAmount), 0);

  return (
    <div>
      <PageHeader title="Payouts" description="Tasker compensation and platform commission." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending payouts" value={pending.length} />
        <StatCard label="Pending amount" value={formatCurrency(pending.reduce((s, p) => s + Number(p.netAmount), 0))} />
        <StatCard label="Total commission" value={formatCurrency(commission)} />
      </div>

      {payouts.length === 0 ? (
        <EmptyState title="No payouts yet" description="Payouts are generated when tasks are delivered." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3">Tasker</th>
                <th className="px-5 py-3">Task</th>
                <th className="px-5 py-3">Gross</th>
                <th className="px-5 py-3">Commission</th>
                <th className="px-5 py-3">Net</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3">{p.tasker.name ?? p.tasker.email}</td>
                  <td className="px-5 py-3">
                    <Link href={`/app/tasks/${p.task.id}`} className="text-brand-600 hover:underline">
                      {p.task.reference}
                    </Link>
                    <div className="text-xs text-gray-400">{relativeTime(p.createdAt)}</div>
                  </td>
                  <td className="px-5 py-3">{formatCurrency(Number(p.grossAmount), p.currency)}</td>
                  <td className="px-5 py-3 text-emerald-700">{formatCurrency(Number(p.commissionAmount), p.currency)}</td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(Number(p.netAmount), p.currency)}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${p.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {p.status !== "PAID" && (
                      <form action={markPayoutPaid}>
                        <input type="hidden" name="payoutId" value={p.id} />
                        <SubmitButton className="btn-ghost text-sm">Mark paid</SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
