import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Section } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { relativeTime } from "@/lib/utils";
import { publishRubricVersion } from "@/server/rubrics";
import { RubricForm } from "../rubric-form";

export const dynamic = "force-dynamic";

function ContractField({ label, value }: { label: string; value: unknown }) {
  if (typeof value !== "string" || !value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="whitespace-pre-wrap text-gray-700">{value}</dd>
    </div>
  );
}

export default async function RubricDetail({
  params,
}: {
  params: Promise<{ rubricId: string }>;
}) {
  await requireAdmin();
  const { rubricId } = await params;

  const versions = await prisma.rubricVersion.findMany({
    where: { rubricId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { batches: true } } },
  });
  if (versions.length === 0) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/admin/rubrics"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Rubrics
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{rubricId}</h1>
        <div className="text-sm text-gray-500">{versions.length} version(s)</div>
      </div>

      <Section title="Versions">
        <ul className="space-y-3">
          {versions.map((v) => {
            const c = (v.contract ?? {}) as Record<string, unknown>;
            return (
              <li key={v.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{v.version}</span>
                  <div className="flex items-center gap-2">
                    {v.acceptanceThreshold != null && (
                      <span className="badge bg-brand-50 text-brand-700">
                        ≥ {Math.round(v.acceptanceThreshold.toNumber() * 100)}%
                      </span>
                    )}
                    {v.publishedAt ? (
                      <span className="badge bg-green-50 text-green-700">
                        published
                      </span>
                    ) : (
                      <form action={publishRubricVersion}>
                        <input type="hidden" name="versionId" value={v.id} />
                        <SubmitButton className="btn-secondary">
                          Publish
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {v._count.batches} batch(es) · {relativeTime(v.createdAt)}
                </div>
                <dl className="mt-2 space-y-2 text-sm">
                  <ContractField label="Use case" value={c.useCase} />
                  <ContractField label="Unit of work" value={c.unitOfWork} />
                  <ContractField label="Output schema" value={c.outputSchema} />
                  <ContractField label="Rubric" value={c.rubric} />
                  <ContractField label="Domain rules" value={c.domainRules} />
                  <ContractField label="Edge cases" value={c.edgeCases} />
                </dl>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="New version">
        <RubricForm rubricId={rubricId} />
      </Section>
    </div>
  );
}
