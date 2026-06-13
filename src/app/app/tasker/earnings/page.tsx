import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader, StatCard } from "@/components/app/ui";
import { formatCurrency, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const viewer = await requireViewer();
  const payouts = await prisma.payout.findMany({
    where: { taskerId: viewer.id },
    include: { task: { select: { id: true, reference: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  const paid = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.netAmount), 0);
  const pending = payouts.filter((p) => p.status !== "PAID").reduce((s, p) => s + Number(p.netAmount), 0);

  return (
    <div>
      <PageHeader title="Earnings" description="Your compensation, net of platform commission." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Paid out" value={formatCurrency(paid)} />
        <StatCard label="Pending" value={formatCurrency(pending)} />
        <StatCard label="Payouts" value={payouts.length} />
      </div>

      {payouts.length === 0 ? (
        <div className="card px-5 py-12 text-center text-sm text-gray-500">
          No payouts yet. Complete and deliver work to earn.
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {payouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <Link href={`/app/tasks/${p.task.id}`} className="font-medium hover:underline">
                  {p.task.title}
                </Link>
                <div className="text-xs text-gray-500">
                  {p.task.reference} · gross {formatCurrency(Number(p.grossAmount), p.currency)} · commission{" "}
                  {formatCurrency(Number(p.commissionAmount), p.currency)} · {relativeTime(p.createdAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(Number(p.netAmount), p.currency)}</div>
                <span className="badge bg-gray-100 text-gray-600">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
