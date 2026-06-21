import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  await requireAdmin();
  const batches = await prisma.batch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rubricVersion: { select: { rubricId: true, version: true } },
      _count: { select: { items: true } },
    },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Data batches"
        description="Controlled release units of items for human-data production."
        action={
          <Link href="/app/admin/batches/new" className="btn-primary">
            New batch
          </Link>
        }
      />
      {batches.length === 0 ? (
        <EmptyState
          title="No batches yet"
          description="Create a batch to start producing human data against a rubric."
          action={
            <Link href="/app/admin/batches/new" className="btn-primary">
              Create one
            </Link>
          }
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {batches.map((b) => (
            <Link
              key={b.id}
              href={`/app/admin/batches/${b.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">
                  {b.reference}{" "}
                  <span className="text-gray-400">·</span>{" "}
                  <span className="text-gray-600">
                    {b.rubricVersion.rubricId}@{b.rubricVersion.version}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {b.kind} · K={b.replicas} · {b._count.items} item(s) ·{" "}
                  {relativeTime(b.createdAt)}
                </div>
              </div>
              <span className="badge bg-gray-100 text-gray-700">{b.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
