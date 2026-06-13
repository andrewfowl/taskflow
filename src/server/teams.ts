"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";
import { slugify } from "@/lib/utils";

async function uniqueTeamSlug(name: string) {
  const base = slugify(name) || "team";
  let slug = base;
  let n = 1;
  while (await prisma.team.findUnique({ where: { slug } })) slug = `${base}-${n++}`;
  return slug;
}

export async function createTeam(formData: FormData) {
  const viewer = await requireViewer();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  if (!name) throw new Error("Team name is required");

  const team = await prisma.team.create({
    data: {
      name,
      description,
      slug: await uniqueTeamSlug(name),
      ownerId: viewer.id,
      members: { create: { userId: viewer.id, role: "LEAD" } },
    },
  });
  redirect(`/app/tasker/teams/${team.id}`);
}

async function assertTeamLead(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: { where: { userId } } },
  });
  if (!team) throw new Error("Team not found");
  const isLead = team.ownerId === userId || team.members.some((m) => m.role === "LEAD");
  if (!isLead) throw new Error("Only team leads can manage members");
  return team;
}

export async function addTeamMember(formData: FormData) {
  const viewer = await requireViewer();
  const teamId = String(formData.get("teamId") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const canAccessFiles = formData.get("canAccessFiles") === "on";
  await assertTeamLead(teamId, viewer.id);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("No user with that email");

  await prisma.teamMembership.upsert({
    where: { teamId_userId: { teamId, userId: user.id } },
    update: { canAccessFiles },
    create: { teamId, userId: user.id, role: "MEMBER", canAccessFiles },
  });
  revalidatePath(`/app/tasker/teams/${teamId}`);
}

export async function removeTeamMember(formData: FormData) {
  const viewer = await requireViewer();
  const teamId = String(formData.get("teamId") || "");
  const userId = String(formData.get("userId") || "");
  const team = await assertTeamLead(teamId, viewer.id);
  if (userId === team.ownerId) throw new Error("Cannot remove the team owner");

  await prisma.teamMembership.delete({
    where: { teamId_userId: { teamId, userId } },
  });
  revalidatePath(`/app/tasker/teams/${teamId}`);
}
