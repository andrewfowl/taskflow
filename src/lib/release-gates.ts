import type { Batch, Item } from "@prisma/client";

// Objective release gates for a data batch. Pure and dependency-free so it can
// be unit-tested and reused. Gates that depend on the review/annotation layer
// (defect rate, reviewer completion, client acceptance, model impact) are
// reported as "skip" until that layer lands (Phase 3) — they must not
// false-fail a release in the meantime. See docs/data-production.md §7.

export type GateStatus = "pass" | "fail" | "skip";

export type GateResult = {
  key: string;
  label: string;
  status: GateStatus;
  detail: string;
};

type BatchGateInput = Pick<Batch, "acceptanceThreshold" | "targetCount">;
type ItemGateInput = Pick<Item, "status" | "input" | "schemaVersion">;

export function evaluateGates(
  batch: BatchGateInput,
  items: ItemGateInput[],
): { gates: GateResult[]; passed: boolean } {
  const total = items.length;
  const gates: GateResult[] = [];

  // 1. Items present — can't release an empty batch.
  gates.push({
    key: "items_present",
    label: "Items present",
    status: total > 0 ? "pass" : "fail",
    detail: `${total} item(s)`,
  });

  // 2. Target count met (only if a target is set).
  if (batch.targetCount != null) {
    gates.push({
      key: "target_met",
      label: "Target count met",
      status: total >= batch.targetCount ? "pass" : "fail",
      detail: `${total} / ${batch.targetCount}`,
    });
  } else {
    gates.push(skip("target_met", "Target count met", "no target set"));
  }

  // 3. Schema & required metadata — every item has content + a schema version.
  const malformed = items.filter(
    (it) => !it.schemaVersion || !hasContent(it.input),
  ).length;
  gates.push({
    key: "schema_metadata",
    label: "Schema & metadata",
    status: total === 0 ? "skip" : malformed === 0 ? "pass" : "fail",
    detail:
      total === 0
        ? "no items"
        : malformed === 0
          ? "all items valid"
          : `${malformed} malformed`,
  });

  // 4. Acceptance rate vs threshold (only if a threshold is set).
  if (batch.acceptanceThreshold != null) {
    const threshold = batch.acceptanceThreshold.toNumber();
    const accepted = items.filter(
      (it) => it.status === "ACCEPTED" || it.status === "RELEASED",
    ).length;
    const rate = total > 0 ? accepted / total : 0;
    gates.push({
      key: "acceptance_rate",
      label: "Acceptance rate",
      status: rate >= threshold ? "pass" : "fail",
      detail: `${pct(rate)} accepted (≥ ${pct(threshold)})`,
    });
  } else {
    gates.push(skip("acceptance_rate", "Acceptance rate", "no threshold set"));
  }

  // 5. Dataset card — createRelease always auto-generates one.
  gates.push({
    key: "dataset_card",
    label: "Dataset card",
    status: "pass",
    detail: "auto-generated",
  });

  // Deferred gates — require the review/annotation layer (Phase 3).
  for (const [key, label] of DEFERRED_GATES) {
    gates.push(skip(key, label, "pending review/annotation layer"));
  }

  // A release passes when nothing fails (skipped gates do not block).
  const passed = gates.every((g) => g.status !== "fail");
  return { gates, passed };
}

const DEFERRED_GATES: [string, string][] = [
  ["critical_defects", "Critical defect rate"],
  ["reviewer_completion", "Reviewer completion"],
  ["client_acceptance", "Client acceptance"],
  ["model_impact", "Model-impact check"],
];

function skip(key: string, label: string, detail: string): GateResult {
  return { key, label, status: "skip", detail };
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function hasContent(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true; // numbers, booleans
}
