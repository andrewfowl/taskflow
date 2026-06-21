import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { Section } from "@/components/app/ui";
import { WorkerAnnotateForm } from "./worker-form";

export const dynamic = "force-dynamic";

export default async function AnnotateItem({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const viewer = await requireViewer();
  const { itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      batch: { include: { rubricVersion: true } },
      annotations: { where: { workerId: viewer.id }, select: { id: true } },
    },
  });
  if (!item) notFound();

  const contract = item.batch.rubricVersion.contract as Record<
    string,
    unknown
  > | null;
  const useCase =
    contract && typeof contract.useCase === "string" ? contract.useCase : null;
  const notes =
    contract && typeof contract.notes === "string" ? contract.notes : null;
  const alreadyDone = item.annotations.length > 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/app/tasker/annotate"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Back to queue
        </Link>
        <h1 className="mt-1 text-xl font-bold">Annotate item</h1>
        <div className="mt-1 text-sm text-gray-500">
          {item.batch.rubricVersion.rubricId}@{item.batch.rubricVersion.version}{" "}
          · {item.batch.reference}
        </div>
      </div>

      <Section title="Rubric">
        <div className="text-sm">
          {useCase && (
            <div className="mb-1">
              <span className="font-medium">Use case:</span> {useCase}
            </div>
          )}
          {notes ? (
            <p className="whitespace-pre-wrap text-gray-700">{notes}</p>
          ) : (
            <p className="text-gray-400">No additional rubric notes.</p>
          )}
        </div>
      </Section>

      <Section title="Item">
        <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
          {JSON.stringify(item.input, null, 2)}
        </pre>
      </Section>

      <Section title="Your annotation">
        {alreadyDone ? (
          <p className="text-sm text-green-700">
            ✓ You&apos;ve submitted your annotation for this item.
          </p>
        ) : (
          <WorkerAnnotateForm itemId={item.id} />
        )}
      </Section>
    </div>
  );
}
