"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma, type FieldKind, type TaskerLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/utils";

// Create a configurable task type along with its intake fields. Admin-only.
// Field arrays arrive positionally: fieldLabel[], fieldKey[], fieldKind[], etc.
export async function createTaskType(formData: FormData) {
  const viewer = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");

  const description = String(formData.get("description") || "").trim() || null;
  const category = String(formData.get("category") || "").trim() || null;
  const requiredLevel = (String(formData.get("requiredLevel") || "") || null) as TaskerLevel | null;
  const autoAssign = formData.get("autoAssign") === "on";
  const defaultBudgetRaw = String(formData.get("defaultBudget") || "").trim();
  const defaultHoursRaw = String(formData.get("defaultHours") || "").trim();

  let slug = slugify(name) || "task-type";
  let n = 1;
  while (await prisma.taskType.findUnique({ where: { slug } })) slug = `${slugify(name)}-${n++}`;

  const labels = formData.getAll("fieldLabel").map(String);
  const kinds = formData.getAll("fieldKind").map(String);
  const requireds = formData.getAll("fieldRequired").map(String);
  const helps = formData.getAll("fieldHelp").map(String);
  const optionsList = formData.getAll("fieldOptions").map(String);

  const fields = labels
    .map((label, i) => ({ label: label.trim(), i }))
    .filter((f) => f.label.length > 0)
    .map((f, order) => {
      const kind = (kinds[f.i] || "TEXT") as FieldKind;
      const opts = optionsList[f.i]
        ? optionsList[f.i].split(",").map((o) => o.trim()).filter(Boolean)
        : null;
      return {
        label: f.label,
        key: slugify(f.label).replace(/-/g, "_") || `field_${order}`,
        kind,
        required: requireds[f.i] === "on" || requireds[f.i] === "true",
        helpText: helps[f.i]?.trim() || null,
        options: (opts ?? undefined) as Prisma.InputJsonValue | undefined,
        order,
      };
    });

  const created = await prisma.taskType.create({
    data: {
      name,
      slug,
      description,
      category,
      requiredLevel,
      autoAssign,
      defaultBudget: defaultBudgetRaw ? new Prisma.Decimal(Number(defaultBudgetRaw) || 0) : null,
      defaultHours: defaultHoursRaw ? new Prisma.Decimal(Number(defaultHoursRaw) || 0) : null,
      fields: { create: fields },
    },
  });
  void viewer;
  redirect(`/app/admin/task-types/${created.id}`);
}

export async function toggleTaskType(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const tt = await prisma.taskType.findUniqueOrThrow({ where: { id } });
  await prisma.taskType.update({ where: { id }, data: { isActive: !tt.isActive } });
  revalidatePath("/app/admin/task-types");
}
