/* eslint-disable no-console */
import { PrismaClient, Prisma } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "password123";
const STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || ".localstorage";

async function hash(p: string) {
  return bcrypt.hash(p, 10);
}

// Write a tiny placeholder so seeded files are actually downloadable in local
// (disk) storage mode.
async function writePlaceholder(key: string, contents: string) {
  if ((process.env.STORAGE_DRIVER || "local") !== "local") return;
  const target = path.resolve(process.cwd(), STORAGE_DIR, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents);
}

async function ensureUser(opts: {
  email: string;
  name: string;
  isPlatformAdmin?: boolean;
  tasker?: { level: Prisma.TaskerProfileCreateInput["level"]; rate: number; skills: string[] };
}) {
  const hashed = await hash(PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: opts.email },
    update: { name: opts.name, isPlatformAdmin: opts.isPlatformAdmin ?? false },
    create: { email: opts.email, name: opts.name, hashedPassword: hashed, isPlatformAdmin: opts.isPlatformAdmin ?? false },
  });

  if (opts.tasker) {
    const profile = await prisma.taskerProfile.upsert({
      where: { userId: user.id },
      update: { level: opts.tasker.level, hourlyRate: new Prisma.Decimal(opts.tasker.rate) },
      create: {
        userId: user.id,
        level: opts.tasker.level,
        hourlyRate: new Prisma.Decimal(opts.tasker.rate),
        headline: `${opts.name}`,
      },
    });
    for (const name of opts.tasker.skills) {
      const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
      await prisma.taskerSkill.upsert({
        where: { taskerProfileId_skillId: { taskerProfileId: profile.id, skillId: skill.id } },
        update: {},
        create: { taskerProfileId: profile.id, skillId: skill.id, level: opts.tasker.level },
      });
    }
  }
  return user;
}

async function ensureTaskType(opts: {
  name: string;
  slug: string;
  category: string;
  requiredLevel: Prisma.TaskTypeCreateInput["requiredLevel"];
  defaultBudget: number;
  defaultHours: number;
  fields: { label: string; key: string; kind: Prisma.TaskTypeFieldCreateManyTaskTypeInput["kind"]; required?: boolean; options?: string[] }[];
}) {
  const existing = await prisma.taskType.findUnique({ where: { slug: opts.slug } });
  if (existing) return existing;
  return prisma.taskType.create({
    data: {
      name: opts.name,
      slug: opts.slug,
      category: opts.category,
      requiredLevel: opts.requiredLevel,
      defaultBudget: new Prisma.Decimal(opts.defaultBudget),
      defaultHours: new Prisma.Decimal(opts.defaultHours),
      fields: {
        create: opts.fields.map((f, order) => ({
          label: f.label,
          key: f.key,
          kind: f.kind,
          required: f.required ?? false,
          options: (f.options ?? undefined) as Prisma.InputJsonValue | undefined,
          order,
        })),
      },
    },
  });
}

async function main() {
  console.log("Seeding TaskFlow…");

  // Skills
  for (const s of ["Research", "Writing", "Editing", "SQL", "Design", "Branding", "Legal", "Contracts", "Data Analysis", "Translation"]) {
    await prisma.skill.upsert({ where: { name: s }, update: {}, create: { name: s } });
  }

  // Users
  const admin = await ensureUser({ email: "admin@taskflow.dev", name: "Dana Dispatcher", isPlatformAdmin: true });
  const alex = await ensureUser({ email: "alex@taskflow.dev", name: "Alex Analyst", tasker: { level: "SENIOR", rate: 80, skills: ["Research", "Writing", "Data Analysis"] } });
  const bru = await ensureUser({ email: "bru@taskflow.dev", name: "Bru Designer", tasker: { level: "INTERMEDIATE", rate: 60, skills: ["Design", "Branding"] } });
  const cara = await ensureUser({ email: "cara@taskflow.dev", name: "Cara Counsel", tasker: { level: "EXPERT", rate: 150, skills: ["Legal", "Contracts"] } });
  const rita = await ensureUser({ email: "rita@example.com", name: "Rita Requestor" });
  const owner = await ensureUser({ email: "owner@acme.test", name: "Olive Owner" });
  const member = await ensureUser({ email: "member@acme.test", name: "Marty Member" });

  // Personal subscription for Rita
  await prisma.subscription.upsert({
    where: { ownerUserId: rita.id },
    update: { tier: "PRO", status: "ACTIVE", includedTasks: 150 },
    create: { ownerUserId: rita.id, tier: "PRO", status: "ACTIVE", includedTasks: 150 },
  });

  // Entity: Acme
  const acme = await prisma.entity.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Inc.", slug: "acme", billingEmail: "billing@acme.test" },
  });
  await prisma.subscription.upsert({
    where: { entityId: acme.id },
    update: { tier: "ENTERPRISE", status: "ACTIVE", includedTasks: 1000 },
    create: { entityId: acme.id, tier: "ENTERPRISE", status: "ACTIVE", includedTasks: 1000 },
  });
  for (const [u, role] of [[owner, "OWNER"], [member, "MEMBER"]] as const) {
    await prisma.membership.upsert({
      where: { userId_entityId: { userId: u.id, entityId: acme.id } },
      update: { role },
      create: { userId: u.id, entityId: acme.id, role },
    });
  }

  // Team owned by Alex, with Bru
  const team = await prisma.team.upsert({
    where: { slug: "insight-squad" },
    update: {},
    create: {
      name: "Insight Squad",
      slug: "insight-squad",
      description: "Research & analysis collective",
      ownerId: alex.id,
      members: {
        create: [
          { userId: alex.id, role: "LEAD" },
          { userId: bru.id, role: "MEMBER", canAccessFiles: true },
        ],
      },
    },
  });

  // Task types
  const research = await ensureTaskType({
    name: "Market Research Report", slug: "market-research-report", category: "Research", requiredLevel: "SENIOR", defaultBudget: 1200, defaultHours: 15,
    fields: [
      { label: "Industry", key: "industry", kind: "TEXT", required: true },
      { label: "Geography", key: "geography", kind: "TEXT" },
      { label: "Objectives", key: "objectives", kind: "TEXTAREA", required: true },
      { label: "Reference documents", key: "references", kind: "FILE" },
      { label: "Deadline sensitivity", key: "deadline_sensitivity", kind: "SELECT", options: ["Low", "Medium", "High"] },
    ],
  });
  const logo = await ensureTaskType({
    name: "Logo Design", slug: "logo-design", category: "Design", requiredLevel: "INTERMEDIATE", defaultBudget: 600, defaultHours: 8,
    fields: [
      { label: "Brand name", key: "brand_name", kind: "TEXT", required: true },
      { label: "Style preferences", key: "style", kind: "TEXTAREA" },
      { label: "Brand assets", key: "assets", kind: "FILE" },
    ],
  });
  const contract = await ensureTaskType({
    name: "Contract Review", slug: "contract-review", category: "Legal", requiredLevel: "EXPERT", defaultBudget: 900, defaultHours: 6,
    fields: [
      { label: "Contract type", key: "contract_type", kind: "SELECT", options: ["NDA", "MSA", "Employment", "Other"], required: true },
      { label: "Contract file", key: "contract_file", kind: "FILE", required: true },
      { label: "Concerns", key: "concerns", kind: "TEXTAREA" },
    ],
  });

  // Helper to create a demo task only once (idempotent by reference).
  async function demoTask(reference: string, build: () => Promise<void>) {
    const exists = await prisma.task.findUnique({ where: { reference } });
    if (exists) return;
    await build();
  }

  // T1 — delivered market research (full lifecycle)
  await demoTask("TF-DEMO1", async () => {
    const t = await prisma.task.create({
      data: {
        reference: "TF-DEMO1", title: "Q3 fintech market landscape", status: "DELIVERED", priority: "HIGH",
        taskTypeId: research.id, requestorId: rita.id, assigneeId: alex.id, requiredLevel: "SENIOR",
        budgetAmount: new Prisma.Decimal(1200), budgetHours: new Prisma.Decimal(15), currency: "USD",
        submittedAt: new Date(Date.now() - 12 * 864e5), assignedAt: new Date(Date.now() - 11 * 864e5),
        startedAt: new Date(Date.now() - 10 * 864e5), completedAt: new Date(Date.now() - 3 * 864e5),
        deliveredAt: new Date(Date.now() - 2 * 864e5),
        fieldValues: {
          create: [
            { fieldId: (await fieldId(research.id, "industry")), value: "Fintech" },
            { fieldId: (await fieldId(research.id, "objectives")), value: "Map the competitive landscape and identify whitespace." },
          ],
        },
      },
    });
    await prisma.assignment.create({ data: { taskId: t.id, assigneeId: alex.id, assignedById: admin.id, status: "COMPLETED" } });
    const plan = await prisma.projectPlan.create({
      data: { taskId: t.id, taskerId: alex.id, pricingModel: "FIXED", fixedPrice: new Prisma.Decimal(1200), estimatedHours: new Prisma.Decimal(15), status: "APPROVED", submittedAt: new Date(Date.now() - 10 * 864e5), decidedAt: new Date(Date.now() - 10 * 864e5), summary: "Desk research + 5 expert calls + report." },
    });
    await prisma.planMilestone.createMany({ data: [
      { planId: plan.id, title: "Desk research", amount: new Prisma.Decimal(400), hours: new Prisma.Decimal(5), order: 0, status: "DONE" },
      { planId: plan.id, title: "Expert interviews", amount: new Prisma.Decimal(500), hours: new Prisma.Decimal(6), order: 1, status: "DONE" },
      { planId: plan.id, title: "Report", amount: new Prisma.Decimal(300), hours: new Prisma.Decimal(4), order: 2, status: "DONE" },
    ] });
    await prisma.timeEntry.createMany({ data: [
      { taskId: t.id, taskerId: alex.id, minutes: 300, description: "Desk research", costAmount: new Prisma.Decimal(400) },
      { taskId: t.id, taskerId: alex.id, minutes: 360, description: "Interviews", costAmount: new Prisma.Decimal(480) },
      { taskId: t.id, taskerId: alex.id, minutes: 210, description: "Writing", costAmount: new Prisma.Decimal(280) },
    ] });
    const deliverable = await prisma.deliverable.create({ data: { taskId: t.id, taskerId: alex.id, title: "Final report", status: "DELIVERED", version: 1 } });
    const key = `tasks/${t.id}/seed-report.txt`;
    await writePlaceholder(key, "TaskFlow demo deliverable — Q3 fintech report.\n");
    await prisma.storedFile.create({ data: { storageKey: key, filename: "fintech-report.txt", mimeType: "text/plain", size: 48, scope: "TASKER_DELIVERABLE", taskId: t.id, deliverableId: deliverable.id, uploaderId: alex.id } });
    await prisma.qcReview.create({ data: { taskId: t.id, deliverableId: deliverable.id, reviewerId: admin.id, kind: "PRIMARY_QC", decision: "APPROVED", score: 92, comments: "Thorough and well-sourced." } });
    const split = computeSplit(1200, 0.15);
    await prisma.payout.create({ data: { taskerId: alex.id, taskId: t.id, grossAmount: new Prisma.Decimal(split.gross), commissionRate: new Prisma.Decimal(0.15), commissionAmount: new Prisma.Decimal(split.commission), netAmount: new Prisma.Decimal(split.net), status: "PAID", paidAt: new Date(Date.now() - 1 * 864e5) } });
    await prisma.comment.create({ data: { taskId: t.id, authorId: alex.id, body: "Delivered the final report — let me know if you'd like a readout call.", visibility: "CLIENT" } });
  });

  // T2 — in progress logo for Acme
  await demoTask("TF-DEMO2", async () => {
    const t = await prisma.task.create({
      data: {
        reference: "TF-DEMO2", title: "Acme rebrand — primary logo", status: "IN_PROGRESS", priority: "NORMAL",
        taskTypeId: logo.id, requestorId: owner.id, entityId: acme.id, assigneeId: bru.id, assignedTeamId: team.id, requiredLevel: "INTERMEDIATE",
        budgetAmount: new Prisma.Decimal(480), budgetHours: new Prisma.Decimal(8),
        submittedAt: new Date(Date.now() - 5 * 864e5), assignedAt: new Date(Date.now() - 4 * 864e5), startedAt: new Date(Date.now() - 3 * 864e5),
        fieldValues: { create: [{ fieldId: await fieldId(logo.id, "brand_name"), value: "Acme" }, { fieldId: await fieldId(logo.id, "style"), value: "Modern, geometric, blue." }] },
      },
    });
    await prisma.assignment.create({ data: { taskId: t.id, assigneeId: bru.id, teamId: team.id, assignedById: admin.id, status: "ACTIVE" } });
    await prisma.projectPlan.create({ data: { taskId: t.id, taskerId: bru.id, pricingModel: "HOURLY", hourlyRate: new Prisma.Decimal(60), estimatedHours: new Prisma.Decimal(8), status: "APPROVED", submittedAt: new Date(Date.now() - 4 * 864e5), decidedAt: new Date(Date.now() - 4 * 864e5), summary: "3 concepts, 2 revision rounds." } });
    await prisma.timeEntry.create({ data: { taskId: t.id, taskerId: bru.id, minutes: 180, description: "Initial concepts", costAmount: new Prisma.Decimal(180) } });
  });

  // T3 — contract review awaiting triage (Acme member)
  await demoTask("TF-DEMO3", async () => {
    const t = await prisma.task.create({
      data: {
        reference: "TF-DEMO3", title: "Review vendor MSA", status: "TRIAGE", priority: "URGENT",
        taskTypeId: contract.id, requestorId: member.id, entityId: acme.id, requiredLevel: "EXPERT",
        budgetAmount: new Prisma.Decimal(900), budgetHours: new Prisma.Decimal(6),
        submittedAt: new Date(Date.now() - 1 * 864e5),
        fieldValues: { create: [{ fieldId: await fieldId(contract.id, "contract_type"), value: "MSA" }, { fieldId: await fieldId(contract.id, "concerns"), value: "Liability caps and IP assignment." }] },
      },
    });
    const key = `tasks/${t.id}/seed-msa.txt`;
    await writePlaceholder(key, "Demo MSA contract text.\n");
    await prisma.storedFile.create({ data: { storageKey: key, filename: "vendor-msa.txt", mimeType: "text/plain", size: 24, scope: "REQUESTOR_INPUT", taskId: t.id, fieldId: await fieldId(contract.id, "contract_file"), uploaderId: member.id } });
  });

  // T4 — market research submitted for QC
  await demoTask("TF-DEMO4", async () => {
    const t = await prisma.task.create({
      data: {
        reference: "TF-DEMO4", title: "Renewables supply-chain scan", status: "SUBMITTED_FOR_QC", priority: "NORMAL",
        taskTypeId: research.id, requestorId: rita.id, assigneeId: alex.id, requiredLevel: "SENIOR",
        budgetAmount: new Prisma.Decimal(1000), budgetHours: new Prisma.Decimal(12),
        submittedAt: new Date(Date.now() - 6 * 864e5), assignedAt: new Date(Date.now() - 5 * 864e5), startedAt: new Date(Date.now() - 4 * 864e5), completedAt: new Date(Date.now() - 1 * 864e5),
        fieldValues: { create: [{ fieldId: await fieldId(research.id, "industry"), value: "Renewables" }, { fieldId: await fieldId(research.id, "objectives"), value: "Identify key suppliers and risks." }] },
      },
    });
    await prisma.assignment.create({ data: { taskId: t.id, assigneeId: alex.id, assignedById: admin.id, status: "ACTIVE" } });
    await prisma.projectPlan.create({ data: { taskId: t.id, taskerId: alex.id, pricingModel: "FIXED", fixedPrice: new Prisma.Decimal(1000), estimatedHours: new Prisma.Decimal(12), status: "APPROVED" } });
    await prisma.timeEntry.create({ data: { taskId: t.id, taskerId: alex.id, minutes: 600, description: "Research + draft", costAmount: new Prisma.Decimal(800) } });
    const deliverable = await prisma.deliverable.create({ data: { taskId: t.id, taskerId: alex.id, title: "Draft scan", status: "SUBMITTED", version: 1 } });
    const key = `tasks/${t.id}/seed-scan.txt`;
    await writePlaceholder(key, "Demo renewables scan draft.\n");
    await prisma.storedFile.create({ data: { storageKey: key, filename: "renewables-scan.txt", mimeType: "text/plain", size: 30, scope: "TASKER_DELIVERABLE", taskId: t.id, deliverableId: deliverable.id, uploaderId: alex.id } });
  });

  console.log("Seed complete.");
  console.log("\nAccounts (password: password123):");
  console.log("  admin@taskflow.dev   — dispatcher/admin");
  console.log("  alex@taskflow.dev    — tasker (senior)");
  console.log("  bru@taskflow.dev     — tasker (designer)");
  console.log("  cara@taskflow.dev    — tasker (legal)");
  console.log("  rita@example.com     — requestor (individual)");
  console.log("  owner@acme.test      — Acme owner");
  console.log("  member@acme.test     — Acme member");
}

async function fieldId(taskTypeId: string, key: string) {
  const f = await prisma.taskTypeField.findUnique({ where: { taskTypeId_key: { taskTypeId, key } } });
  if (!f) throw new Error(`Missing field ${key}`);
  return f.id;
}

function computeSplit(gross: number, rate: number) {
  const commission = Math.round(gross * rate * 100) / 100;
  return { gross, commission, net: Math.round((gross - commission) * 100) / 100 };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
