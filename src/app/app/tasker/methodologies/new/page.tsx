import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { createMethodology } from "@/server/methodologies";
import { MethodologyBuilder } from "../methodology-builder";

export const dynamic = "force-dynamic";

export default async function NewMethodologyPage() {
  const viewer = await requireViewer();
  const [taskTypes, memberships] = await Promise.all([
    prisma.taskType.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.teamMembership.findMany({
      where: { userId: viewer.id },
      include: { team: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="New methodology"
        description="Design the form you'll fill in to document this kind of work. The preview updates as you edit."
      />
      <MethodologyBuilder
        action={createMethodology}
        taskTypes={taskTypes}
        teams={memberships.map((m) => m.team)}
        initial={{ name: "Research report", description: "Desk research documented with the sources consulted and the confidence behind each finding.", taskTypeId: "", teamId: "", isPublished: false, schema: null }}
        submitLabel="Create methodology"
      />
    </div>
  );
}
