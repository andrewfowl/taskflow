import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader, Section } from "@/components/app/ui";
import { addTeamMember, removeTeamMember } from "@/server/teams";
import { SubmitButton } from "@/components/app/submit-button";

export const dynamic = "force-dynamic";

export default async function TeamDetail({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } },
      owner: { select: { name: true } },
      _count: { select: { tasks: true } },
    },
  });
  if (!team) notFound();

  const myMembership = team.members.find((m) => m.userId === viewer.id);
  if (!myMembership && team.ownerId !== viewer.id) redirect("/app/tasker/teams");
  const isLead = team.ownerId === viewer.id || myMembership?.role === "LEAD";

  return (
    <div>
      <PageHeader title={team.name} description={team.description ?? `Owned by ${team.owner.name ?? "—"}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Section title={`Members (${team.members.length})`}>
          <ul className="divide-y divide-gray-100">
            {team.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{m.user.name ?? m.user.email}</div>
                  <div className="text-xs text-gray-500">
                    {m.user.email} · {m.role} · {m.canAccessFiles ? "file access" : "no file access"}
                  </div>
                </div>
                {isLead && m.userId !== team.ownerId && (
                  <form action={removeTeamMember}>
                    <input type="hidden" name="teamId" value={team.id} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <SubmitButton className="btn-ghost text-rose-600">Remove</SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Section>

        {isLead && (
          <Section title="Add a member">
            <form action={addTeamMember} className="space-y-3">
              <input type="hidden" name="teamId" value={team.id} />
              <div>
                <label className="label">Tasker email</label>
                <input name="email" type="email" className="input" required placeholder="tasker@example.com" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="canAccessFiles" defaultChecked /> Grant access to requestor files
              </label>
              <SubmitButton className="btn-primary w-full">Add member</SubmitButton>
            </form>
          </Section>
        )}
      </div>
    </div>
  );
}
