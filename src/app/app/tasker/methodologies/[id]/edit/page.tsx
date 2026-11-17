import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { updateMethodology } from "@/server/methodologies";
import { parseSchema } from "@/lib/methodology-schema";
import { MethodologyBuilder } from "../../methodology-builder";

export const dynamic = "force-dynamic";

export default async function EditMethodologyPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const [m, taskTypes, memberships] = await Promise.all([
    prisma.methodology.findUnique({ where: { id }, include: { _count: { select: { entries: true } } } }),
    prisma.taskType.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.teamMembership.findMany({
      where: { userId: viewer.id },
      include: { team: { select: { id: true, name: true } } },
    }),
  ]);
  if (!m || m.ownerId !== viewer.id) notFound();

  const entryCount = m._count.entries;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Edit ${m.name}`}
        description={
          entryCount > 0
            ? `${entryCount} saved ${entryCount === 1 ? "entry uses" : "entries use"} this methodology. Renaming fields is safe; removed fields stay visible on old entries under "Other".`
            : "Adjust sections and fields. The preview updates as you edit."
        }
      />
      <MethodologyBuilder
        action={updateMethodology}
        methodologyId={m.id}
        taskTypes={taskTypes}
        teams={memberships.map((ms) => ms.team)}
        initial={{
          name: m.name,
          description: m.description ?? "",
          taskTypeId: m.taskTypeId ?? "",
          teamId: m.teamId ?? "",
          isPublished: m.isPublished,
          schema: parseSchema(m.schema),
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
