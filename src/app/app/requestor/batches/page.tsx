import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireViewer, getViewerContext } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Buyer-facing view of the data batches an organisation has commissioned.
// Read-only: the production/QC machinery is operated by the dispatcher; this is
// where the client watches progress and collects the quality receipt.
export default async function RequestorBatches() {
  await requireViewer();
  const ctx = await getViewerContext();
  const entityIds = (ctx?.entities ?? []).map((e) => e.id);

  const batches = entityIds.length
    ? await prisma.batch.findMany({
        where: { entityId: { in: entityIds } },
        orderBy: { updatedAt: "desc" },
        include: {
          rubricVersion: { select: { rubricId: true, version: true } },
          entity: { select: { name: true } },
          _count: { select: { items: true } },
          releases: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { version: true, status: true, clientStatus: true },
          },
        },
        take: 100,
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Data batches"
        description="Datasets your organisation has commissioned, with live progress and a quality receipt for each release."
      />

      {batches.length === 0 ? (
        <EmptyState
          title="No data batches yet"
          description="When your team commissions a labelling or evaluation dataset, it will appear here with its production progress and release gates."
        />
      ) : (
        <ul className="space-y-3">
          {batches.map((b) => {
            const latest = b.releases[0];
            const target = b.targetCount ?? 0;
            const pct =
              target > 0
                ? Math.min(100, Math.round((b._count.items / target) * 100))
                : null;
            return (
              <li key={b.id}>
                <Link
                  href={`/app/requestor/batches/${b.id}`}
                  className="card block p-4 hover:bg-gray-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {b.reference}
                      </span>
                      <span className="badge bg-gray-100 text-gray-700">
                        {b.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {b.rubricVersion.rubricId}@{b.rubricVersion.version} · K=
                        {b.replicas}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {relativeTime(b.updatedAt)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span>
                      {b._count.items}
                      {target > 0 ? ` / ${target}` : ""} item
                      {b._count.items === 1 ? "" : "s"}
                    </span>
                    {pct !== null && (
                      <span className="h-2 w-32 rounded-full bg-gray-100">
                        <span
                          className="block h-2 rounded-full bg-brand-600"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                    )}
                    {latest && (
                      <span className="text-gray-500">
                        Latest release {latest.version} ·{" "}
                        <span className="font-medium">{latest.status}</span> ·
                        client {latest.clientStatus.toLowerCase()}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
