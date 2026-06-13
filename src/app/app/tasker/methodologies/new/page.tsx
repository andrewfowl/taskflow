import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { createMethodology } from "@/server/methodologies";
import { SubmitButton } from "@/components/app/submit-button";

export const dynamic = "force-dynamic";

const EXAMPLE_SCHEMA = JSON.stringify(
  {
    sections: [
      { title: "Approach", fields: [{ key: "approach", label: "Approach taken", type: "textarea" }] },
      { title: "Findings", fields: [{ key: "findings", label: "Key findings", type: "textarea" }] },
      { title: "Sign-off", fields: [{ key: "reviewed", label: "Self-reviewed", type: "checkbox" }] },
    ],
  },
  null,
  2,
);

export default async function NewMethodologyPage() {
  const viewer = await requireViewer();
  const [taskTypes, teams] = await Promise.all([
    prisma.taskType.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.teamMembership.findMany({
      where: { userId: viewer.id },
      include: { team: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New methodology" description="Define the sections and fields used to document this kind of work." />
      <form action={createMethodology} className="card space-y-4 p-5">
        <div>
          <label className="label">Name</label>
          <input name="name" className="input" required placeholder="e.g. Market research report v2" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={2} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">For task type (optional)</label>
            <select name="taskTypeId" className="input" defaultValue="">
              <option value="">Any</option>
              {taskTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Share with team (optional)</label>
            <select name="teamId" className="input" defaultValue="">
              <option value="">Just me</option>
              {teams.map((m) => (
                <option key={m.team.id} value={m.team.id}>{m.team.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Schema (JSON)</label>
          <textarea name="schema" rows={12} className="input font-mono text-xs" defaultValue={EXAMPLE_SCHEMA} />
          <p className="mt-1 text-xs text-gray-500">
            Sections and fields you&apos;ll fill in per task. Leave as-is for a sensible default.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="isPublished" /> Publish so other taskers can use it
        </label>
        <SubmitButton className="btn-primary">Create methodology</SubmitButton>
      </form>
    </div>
  );
}
