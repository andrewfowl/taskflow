import type {
  Batch,
  Item,
  JudgmentKind,
  QcDecision,
  DefectCode,
} from "@prisma/client";

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
type ItemGateInput = Pick<Item, "id" | "status" | "input" | "schemaVersion">;
type JudgmentGateInput = {
  itemId: string;
  kind: JudgmentKind;
  decision: QcDecision;
  defects: DefectCode[];
};

// Defect codes severe enough to block a release outright.
const CRITICAL_DEFECTS: DefectCode[] = [
  "SAFETY_MISS",
  "FACTUAL_ERROR",
  "HALLUCINATED_CITATION",
];

export function evaluateGates(
  batch: BatchGateInput,
  items: ItemGateInput[],
  judgments?: JudgmentGateInput[],
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

  // 6 & 7. Review-dependent gates — computed once judgments are supplied,
  // otherwise skipped (so a release cut before any review does not false-fail).
  if (judgments === undefined) {
    gates.push(
      skip("reviewer_completion", "Reviewer completion", "pending review layer"),
    );
    gates.push(
      skip("critical_defects", "Critical defect rate", "pending review layer"),
    );
  } else {
    const reviewedIds = new Set(
      judgments
        .filter(
          (j) =>
            j.kind === "REVIEW" &&
            (j.decision === "APPROVED" || j.decision === "REJECTED"),
        )
        .map((j) => j.itemId),
    );
    const reviewed = items.filter((it) => reviewedIds.has(it.id)).length;
    gates.push({
      key: "reviewer_completion",
      label: "Reviewer completion",
      status: total > 0 && reviewed === total ? "pass" : "fail",
      detail: `${reviewed}/${total} reviewed`,
    });

    const criticalIds = new Set(
      judgments
        .filter((j) => j.defects.some((d) => CRITICAL_DEFECTS.includes(d)))
        .map((j) => j.itemId),
    );
    const critical = items.filter((it) => criticalIds.has(it.id)).length;
    gates.push({
      key: "critical_defects",
      label: "Critical defect rate",
      status: critical === 0 ? "pass" : "fail",
      detail: `${pct(total > 0 ? critical / total : 0)} · ${critical} item(s) (≤ 0%)`,
    });
  }

  // Still deferred — need a client-acceptance workflow / eval integration.
  gates.push(
    skip("client_acceptance", "Client acceptance", "manual / SLA — not yet wired"),
  );
  gates.push(
    skip("model_impact", "Model-impact check", "pending eval integration"),
  );

  // A release passes when nothing fails (skipped gates do not block).
  const passed = gates.every((g) => g.status !== "fail");
  return { gates, passed };
}

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
