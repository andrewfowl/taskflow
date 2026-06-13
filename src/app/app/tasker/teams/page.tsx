import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader, Section } from "@/components/app/ui";
import { createTeam } from "@/server/teams";
import { SubmitButton } from "@/components/app/submit-button";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const viewer = await requireViewer();
  const memberships = await prisma.teamMembership.findMany({
    where: { userId: viewer.id },
    include: { team: { include: { _count: { select: { members: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Teams" description="Group taskers to collaborate and share file access." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {memberships.length === 0 ? (
            <div className="card px-5 py-12 text-center text-sm text-gray-500">
              You&apos;re not in any teams yet. Create one to start collaborating.
            </div>
          ) : (
            memberships.map((m) => (
              <Link key={m.id} href={`/app/tasker/teams/${m.team.id}`} className="card flex items-center justify-between p-4 hover:bg-gray-50">
                <div>
                  <div className="font-medium">{m.team.name}</div>
                  <div className="text-xs text-gray-500">
                    {m.team._count.members} member(s) · you are {m.role}
                  </div>
                </div>
                <span className="text-sm text-brand-600">Open →</span>
              </Link>
            ))
          )}
        </div>

        <Section title="Create a team">
          <form action={createTeam} className="space-y-3">
            <div>
              <label className="label">Team name</label>
              <input name="name" className="input" required placeholder="Design Guild" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" rows={2} className="input" />
            </div>
            <SubmitButton className="btn-primary w-full">Create team</SubmitButton>
          </form>
        </Section>
      </div>
    </div>
  );
}
