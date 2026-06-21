import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/app/ui";

export const dynamic = "force-dynamic";

export default async function RubricsPage() {
  await requireAdmin();
  const versions = await prisma.rubricVersion.findMany({
    orderBy: [{ rubricId: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { batches: true } } },
  });

  // Group versions into logical rubrics (first per rubricId is the latest).
  const groups = new Map<
    string,
    { latest: string; count: number; batches: number; published: boolean }
  >();
  for (const v of versions) {
    const g = groups.get(v.rubricId);
    if (!g) {
      groups.set(v.rubricId, {
        latest: v.version,
        count: 1,
        batches: v._count.batches,
        published: v.publishedAt != null,
      });
    } else {
      g.count += 1;
      g.batches += v._count.batches;
      if (v.publishedAt) g.published = true;
    }
  }
  const rubrics = [...groups.entries()];

  return (
    <div>
      <PageHeader
        title="Rubrics"
        description="Versioned data contracts that govern how batches are produced."
        action={
          <Link href="/app/admin/rubrics/new" className="btn-primary">
            New rubric
          </Link>
        }
      />
      {rubrics.length === 0 ? (
        <EmptyState
          title="No rubrics yet"
          description="A rubric is the data contract a batch is produced and graded against."
          action={
            <Link href="/app/admin/rubrics/new" className="btn-primary">
              Create one
            </Link>
          }
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {rubrics.map(([rubricId, g]) => (
            <Link
              key={rubricId}
              href={`/app/admin/rubrics/${rubricId}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">{rubricId}</div>
                <div className="text-xs text-gray-500">
                  {g.count} version(s) · latest {g.latest} · {g.batches} batch(es)
                </div>
              </div>
              {g.published ? (
                <span className="badge bg-green-50 text-green-700">
                  published
                </span>
              ) : (
                <span className="badge bg-gray-100 text-gray-500">draft</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
