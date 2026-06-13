import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { PageHeader, Section } from "@/components/app/ui";
import { updateTaskerProfile } from "@/server/profile";
import { SubmitButton } from "@/components/app/submit-button";
import { TASKER_LEVELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TaskerProfilePage() {
  const viewer = await requireViewer();
  const profile = await prisma.taskerProfile.findUnique({
    where: { userId: viewer.id },
    include: { skills: { include: { skill: true } } },
  });

  const skillNames = profile?.skills.map((s) => s.skill.name).join(", ") ?? "";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile & skills" description="How dispatchers and the router match work to you." />
      <Section title="Tasker profile">
        <form action={updateTaskerProfile} className="space-y-4">
          <div>
            <label className="label">Headline</label>
            <input name="headline" className="input" defaultValue={profile?.headline ?? ""} placeholder="Senior data analyst" />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea name="bio" rows={3} className="input" defaultValue={profile?.bio ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Level</label>
              <select name="level" className="input" defaultValue={profile?.level ?? "INTERMEDIATE"}>
                {TASKER_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Hourly rate ($)</label>
              <input name="hourlyRate" type="number" step="any" className="input" defaultValue={profile?.hourlyRate ? Number(profile.hourlyRate) : ""} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Timezone</label>
              <input name="timezone" className="input" defaultValue={profile?.timezone ?? ""} placeholder="UTC+1" />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="available" defaultChecked={profile?.available ?? true} /> Available for work
            </label>
          </div>
          <div>
            <label className="label">Skills (comma-separated)</label>
            <input name="skills" className="input" defaultValue={skillNames} placeholder="Research, Writing, SQL" />
          </div>
          <SubmitButton className="btn-primary">Save profile</SubmitButton>
        </form>
      </Section>
    </div>
  );
}
