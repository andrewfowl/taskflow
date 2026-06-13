"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type TaskerLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireViewer } from "@/lib/session";

// Create a tasker profile for a requestor-only account, enabling the tasker
// workspace. Idempotent.
export async function becomeTasker() {
  const viewer = await requireViewer();
  await prisma.taskerProfile.upsert({
    where: { userId: viewer.id },
    update: {},
    create: { userId: viewer.id },
  });
  revalidatePath("/app");
  revalidatePath("/app/tasker/profile");
}

export async function updateTaskerProfile(formData: FormData) {
  const viewer = await requireViewer();
  const headline = String(formData.get("headline") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;
  const level = (String(formData.get("level") || "INTERMEDIATE")) as TaskerLevel;
  const timezone = String(formData.get("timezone") || "").trim() || null;
  const available = formData.get("available") === "on";
  const rateRaw = String(formData.get("hourlyRate") || "").trim();
  const hourlyRate = rateRaw ? new Prisma.Decimal(Number(rateRaw) || 0) : null;

  await prisma.taskerProfile.upsert({
    where: { userId: viewer.id },
    update: { headline, bio, level, timezone, available, hourlyRate },
    create: { userId: viewer.id, headline, bio, level, timezone, available, hourlyRate },
  });

  // Sync skills (comma-separated). Create any missing Skill rows.
  const skillsRaw = String(formData.get("skills") || "").trim();
  if (skillsRaw) {
    const profile = await prisma.taskerProfile.findUniqueOrThrow({
      where: { userId: viewer.id },
    });
    const names = [...new Set(skillsRaw.split(",").map((s) => s.trim()).filter(Boolean))];
    for (const name of names) {
      const skill = await prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      await prisma.taskerSkill.upsert({
        where: { taskerProfileId_skillId: { taskerProfileId: profile.id, skillId: skill.id } },
        update: {},
        create: { taskerProfileId: profile.id, skillId: skill.id, level },
      });
    }
  }
  revalidatePath("/app/tasker/profile");
}
