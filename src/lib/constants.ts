import type { PlanTier, TaskStatus } from "@prisma/client";

export const PLAN_TIERS: Record<
  PlanTier,
  {
    name: string;
    priceMonthly: number;
    includedTasks: number;
    perTaskOverage: number;
    blurb: string;
    features: string[];
  }
> = {
  FREE: {
    name: "Free",
    priceMonthly: 0,
    includedTasks: 3,
    perTaskOverage: 0,
    blurb: "Evaluate the platform with a few tasks a month.",
    features: ["3 tasks / month", "1 requestor seat", "Community support"],
  },
  STARTER: {
    name: "Starter",
    priceMonthly: 49,
    includedTasks: 25,
    perTaskOverage: 8,
    blurb: "For individuals and small teams shipping steady work.",
    features: [
      "25 tasks / month included",
      "$8 per extra task",
      "Custom task types",
      "Email support",
    ],
  },
  PRO: {
    name: "Pro",
    priceMonthly: 199,
    includedTasks: 150,
    perTaskOverage: 6,
    blurb: "For busy teams that need QC and analytics.",
    features: [
      "150 tasks / month included",
      "$6 per extra task",
      "Quality control + second opinion",
      "Pipeline analytics",
      "Priority routing",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceMonthly: 0, // contact sales
    includedTasks: 1000,
    perTaskOverage: 4,
    blurb: "Entity-wide governance, SSO, and dedicated taskers.",
    features: [
      "Volume pricing",
      "Unlimited seats & entities",
      "SSO / SAML (bring your own IdP)",
      "Dedicated dispatcher",
      "Self-hosting option",
    ],
  },
};

type StatusMeta = { label: string; tone: string; group: "intake" | "active" | "qc" | "done" | "stopped" };

export const TASK_STATUS_META: Record<TaskStatus, StatusMeta> = {
  DRAFT: { label: "Draft", tone: "bg-gray-100 text-gray-700", group: "intake" },
  SUBMITTED: { label: "Submitted", tone: "bg-blue-100 text-blue-700", group: "intake" },
  TRIAGE: { label: "Triage", tone: "bg-indigo-100 text-indigo-700", group: "intake" },
  ASSIGNED: { label: "Assigned", tone: "bg-violet-100 text-violet-700", group: "active" },
  IN_PROGRESS: { label: "In progress", tone: "bg-amber-100 text-amber-800", group: "active" },
  SUBMITTED_FOR_QC: { label: "Submitted for QC", tone: "bg-cyan-100 text-cyan-800", group: "qc" },
  QC_IN_REVIEW: { label: "QC in review", tone: "bg-teal-100 text-teal-800", group: "qc" },
  SECOND_OPINION: { label: "Second opinion", tone: "bg-fuchsia-100 text-fuchsia-800", group: "qc" },
  REVISION_REQUESTED: { label: "Revision requested", tone: "bg-orange-100 text-orange-800", group: "active" },
  APPROVED: { label: "Approved", tone: "bg-emerald-100 text-emerald-800", group: "done" },
  DELIVERED: { label: "Delivered", tone: "bg-green-100 text-green-800", group: "done" },
  ON_HOLD: { label: "On hold", tone: "bg-yellow-100 text-yellow-800", group: "stopped" },
  CANCELLED: { label: "Cancelled", tone: "bg-rose-100 text-rose-700", group: "stopped" },
};

// Allowed status transitions, enforced server-side. Keeps the pipeline honest.
export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["TRIAGE", "ASSIGNED", "CANCELLED"],
  TRIAGE: ["ASSIGNED", "ON_HOLD", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "TRIAGE", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["SUBMITTED_FOR_QC", "ON_HOLD", "TRIAGE", "CANCELLED"],
  SUBMITTED_FOR_QC: ["QC_IN_REVIEW"],
  QC_IN_REVIEW: ["APPROVED", "REVISION_REQUESTED", "SECOND_OPINION"],
  SECOND_OPINION: ["APPROVED", "REVISION_REQUESTED"],
  REVISION_REQUESTED: ["IN_PROGRESS", "CANCELLED"],
  APPROVED: ["DELIVERED"],
  DELIVERED: [],
  ON_HOLD: ["TRIAGE", "ASSIGNED", "IN_PROGRESS", "CANCELLED"],
  CANCELLED: [],
};

export const TASKER_LEVELS = ["JUNIOR", "INTERMEDIATE", "SENIOR", "EXPERT"] as const;
export const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
