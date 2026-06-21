import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnnotateQueue() {
  const viewer = await requireViewer();
  const profile = await prisma.taskerProfile.findUnique({
    where: { userId: viewer.id },
  });

  if (!profile) {
    return (
      <div>
        <PageHeader title="Annotate" />
        <EmptyState
          title="Enable tasker mode first"
          description="You need a tasker profile to pick up annotation work."
          action={
            <Link href="/app/tasker/profile" className="btn-primary">
              Set up profile
            </Link>
          }
        />
      </div>
    );
  }

  // Available = items still collecting annotations, in an active batch, that
  // this worker has not already annotated (one independent annotation each).
  const items = await prisma.item.findMany({
    where: {
      status: { in: ["PENDING", "IN_ANNOTATION"] },
      batch: { status: { in: ["PILOT", "CALIBRATION", "PRODUCTION"] } },
      annotations: { none: { workerId: viewer.id } },
    },
    include: {
      batch: {
        select: {
          reference: true,
          replicas: true,
          kind: true,
          rubricVersion: { select: { rubricId: true } },
        },
      },
      _count: { select: { annotations: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader
        title="Annotate"
        description="Items awaiting your independent annotation."
      />
      {items.length === 0 ? (
        <EmptyState
          title="No items to annotate"
          description="New items appear here as batches go into production."
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {items.map((it) => (
            <Link
              key={it.id}
              href={`/app/tasker/annotate/${it.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">
                  {it.batch.rubricVersion.rubricId}{" "}
                  <span className="text-gray-400">· {it.batch.reference}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {it.batch.kind} · {it._count.annotations}/{it.batch.replicas}{" "}
                  annotations · {relativeTime(it.createdAt)}
                </div>
              </div>
              <span className="btn-secondary">Annotate</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
