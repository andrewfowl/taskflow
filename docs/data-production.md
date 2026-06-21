# Design Doc — TaskFlow as an LLM Human-Data Production System

> **Status:** Draft for discussion — **D1 & D2 decided** · **Date:** 2026-06-20 · **Owner:** TBD
> **Scope:** Architecture proposal only — *no schema or code changes are made by this document.*
> **Source:** Translates the 16-layer "data production system" operating model into TaskFlow's existing data model (`prisma/schema.prisma`).

---

## 1. TL;DR

TaskFlow's existing spine — a status-driven task lifecycle with layered QC, second-opinion adjudication, entities/memberships, teams, and cost/payout primitives — is already ~60–70% of a *controlled production system with expert governance*. To serve large-scale LLM human-data projects we do **not** rebuild; we add a **data-native plane** on top of the existing **work plane**:

- A **Batch → Item → Annotation → Judgment → Release** model for the fine-grained data, distinct from the heavyweight `Task` used for managed work.
- A **defect taxonomy**, **rubric/data-contract versioning**, **gold tasks + agreement**, **release gates**, and a **model-impact feedback loop**.

Two decisions ripple furthest and are called out for sign-off in §4: **(D1) item granularity** and **(D2) annotation redundancy (K-way)**.

---

## 2. Goals / Non-goals

**Goals**
- Run human-data work as a *production system*: control quality, throughput, cost, and stakeholder decisions simultaneously.
- Preserve TaskFlow's existing managed-work flows unchanged (single-tenant and entity work both keep working).
- Make every shipped item traceable: who/what rubric/what review/why accepted/which release/which eval.
- Support SFT, preference/ranking, evals, safety, tool-use, critique/rewrite, and citation-check work types.

**Non-goals (for this doc)**
- Implementing any of it (this is a design proposal).
- The annotation *UI*; we specify the data and lifecycle, not screens.
- A built-in eval/training runner — we integrate with one, we don't become one.

---

## 3. How the framework maps onto today's schema

| Framework layer | Existing model(s) in `schema.prisma` | Fit |
| --- | --- | --- |
| Workstreams (2) | `User.isPlatformAdmin`, `MembershipRole {OWNER,ADMIN,BILLING,MEMBER}`, `TaskerProfile`/`TaskerLevel`, `Team`/`TeamRole` | ✅ |
| Workflow gates (3) | `TaskStatus` (DRAFT→…→SECOND_OPINION→…→DELIVERED), `Assignment` history | ✅ (gaps: pilot/calibration, client-acceptance) |
| Layered QA (4) | `QcReview {kind: PRIMARY_QC \| SECOND_OPINION, decision, score 1..100, parentReviewId}` | 🟡 2 of 4 layers |
| Unit + output schema (1) | `TaskType` + `TaskTypeField {FieldKind}` + `TaskFieldValue(Json)` | 🟡 schema yes, no acceptance threshold |
| Rubric / process (1,9) | `Methodology {schema: Json, isPublished}` + `MethodologyEntry {data: Json}` | 🟡 closest hook, not contract-versioned |
| Item traceability (10) | `AuditLog`, status timestamps, `Assignment[]`, `Deliverable.version` | 🟡 solid base |
| Cost economics (6,12) | `TimeEntry`, `Payout {commissionRate,netAmount}`, `UsageRecord`, `Invoice` | 🟡 cost/item computable, no rework/accepted basis |
| Client + governance (1,12) | `Entity`/`Membership`, `Comment.visibility {INTERNAL,CLIENT}`, `StoredFile {scope, checksum}` (ACL-brokered) | ✅ |
| Batch / dataset / release (3,7,14) | — | ❌ missing (keystone) |
| Defect taxonomy (5) | — (`QcReview` has score + free text only) | ❌ missing |
| Gold tasks / agreement (6,9) | — | ❌ missing |
| Model-impact loop (11,14) | — | ❌ missing |

---

## 4. The two decisions that ripple furthest

These determine the shape of everything downstream. **Both are now decided (2026-06-20)** — see the callouts; the §5 model already reflects them.

### D1 — Item granularity: is a data item a `Task`, or a new lightweight `Item`?

An LLM data project produces thousands–millions of fine units (one prompt, one comparison pair, one rating). TaskFlow's `Task` is a heavyweight object (budget, `ProjectPlan`, milestones, `Payout`). Forcing every prompt/pair/rating through the full `Task` lifecycle does not scale and pollutes the work plane.

- **Option A — Reuse `Task` as the item.** Cheapest schema change; breaks down at volume (millions of Tasks, each with plan/payout machinery), and conflates "a piece of commissioned work" with "a datum."
- **Option B — New lightweight `Item` plane (recommended).** Introduce `Batch` and `Item` as first-class, low-overhead records. `Task`/`Project` stays the **commercial wrapper** that *commissions* one or more `Batch`es; `Item` is the unit that flows through annotation/review/release. Clean separation of *work plane* (Task/Plan/Payout) and *data plane* (Batch/Item/Annotation/Release).

> **✅ Decided — Option B (2026-06-20).** Keep `Task` for commissioning/commercials; model the data at `Batch`/`Item` granularity.

### D2 — Redundancy: single-pass vs K-way annotation with consensus

Today `Task.assigneeId` is a single assignee → one `Deliverable`. Agreement metrics, preference data, ratings, and safety labels need **K independent annotations of the same item**.

- **Option A — Single-pass only.** Quality via review layers (works for SFT, rewrite, critique, tool-use). No native inter-annotator agreement.
- **Option B — Always K-way.** Every item fanned out to K workers; heavy for tasks that don't need redundancy.
- **Option C — Hybrid (recommended).** Model `Annotation` as a first-class child of `Item`; `replicas K` is configurable per `TaskType`/`Batch`. `K=1` reduces exactly to today's single-pass flow; `K>1` enables consensus/agreement + adjudication. One model serves both.

> **✅ Decided — Option C (2026-06-20).** Configurable `Annotation` plane with `K` per batch; `K=1` preserves single-pass, `K>1` unlocks consensus/agreement + adjudication for preference/safety/rating work.

---

## 5. Proposed data model (illustrative — not final)

New models on the **data plane**, layered over the existing **work plane**. Prisma sketches are illustrative.

```prisma
// ── Batch: a controlled release unit of items, commissioned by a Task/Project ──
enum BatchKind { PILOT PRODUCTION CALIBRATION REWORK }
enum BatchStatus {
  DRAFT TASK_DESIGN PILOT CALIBRATION PRODUCTION
  IN_REVIEW QA_AUDIT CLIENT_ACCEPTANCE ACCEPTED RELEASED ON_HOLD CANCELLED
}

model Batch {
  id              String      @id @default(cuid())
  reference       String      @unique           // e.g. BX-1024
  projectTaskId   String?                       // commissioning Task (commercial wrapper)
  entityId        String?                       // client
  kind            BatchKind   @default(PRODUCTION)
  status          BatchStatus @default(DRAFT)
  rubricVersionId String                        // governing contract/rubric (see below)
  replicas        Int         @default(1)       // K — annotations per item (D2)
  acceptanceThreshold Decimal? @db.Decimal(5,4) // min pass rate / quality score
  targetCount     Int?
  // timestamps, relations: items[], releases[], audit ...
}

// ── Item: the fine-grained unit of work (prompt, pair, rating, critique …) ──
enum ItemStatus {
  PENDING IN_ANNOTATION ANNOTATED IN_REVIEW
  ADJUDICATION ACCEPTED REJECTED RELEASED
}

model Item {
  id           String     @id @default(cuid())
  batchId      String
  status       ItemStatus @default(PENDING)
  isGold       Boolean    @default(false)       // hidden gold task (§ calibration)
  expected     Json?                            // gold expected answer + rationale
  input        Json                             // the prompt / pair / source under judgment
  schemaVersion String                          // output schema version
  qualityScore Decimal?   @db.Decimal(5,4)
  // annotations[], judgments[], defects[], audit ...
}

// ── Annotation: one worker's independent output for an item (K per item) ──
model Annotation {
  id        String  @id @default(cuid())
  itemId    String
  workerId  String
  data      Json                                // conforms to output schema
  timeMs    Int?                                // → time-per-item, throughput-at-quality
  createdAt DateTime @default(now())
}

// ── Judgment: review / adjudication, extends today's QcReview semantics ──
enum JudgmentKind { REVIEW SECOND_OPINION QA_AUDIT ADJUDICATION CLIENT }
model Judgment {
  id           String       @id @default(cuid())
  itemId       String
  annotationId String?                          // null = item-level (audit/adjudication)
  reviewerId   String
  kind         JudgmentKind @default(REVIEW)
  decision     QcDecision                       // reuse existing enum
  score        Int?
  defects      DefectCode[]                     // structured taxonomy (below)
  parentId     String?                          // escalation chain (mirrors QcReview)
}

// ── Defect taxonomy (also attachable to QcReview on the work plane) ──
enum DefectCode {
  INSTRUCTION_NONCOMPLIANCE FACTUAL_ERROR REASONING_GAP RUBRIC_MISMATCH
  PREFERENCE_INCONSISTENCY SAFETY_MISS DOMAIN_ERROR SCHEMA_ERROR
  LOW_EFFORT HALLUCINATED_CITATION DUPLICATE REVIEWER_ERROR
}

// ── Rubric / Data Contract as a versioned artifact (extends Methodology idea) ──
model RubricVersion {
  id            String   @id @default(cuid())
  rubricId      String                          // logical rubric
  version       String                          // e.g. v1.4
  contract      Json                            // use case, unit, output schema, domain rules, edge cases
  acceptanceThreshold Decimal? @db.Decimal(5,4)
  publishedAt   DateTime?
}

// ── Release: a versioned, gated dataset export with audit trail ──
enum ReleaseStatus { DRAFT GATED PASSED FAILED EXPORTED }
model Release {
  id          String        @id @default(cuid())
  batchId     String
  version     String                            // dataset version, e.g. ds-2026.06.0
  status      ReleaseStatus @default(DRAFT)
  gateResults Json                              // per-gate pass/fail (see §7)
  datasetCard Json                              // Google Data Card-style documentation
  exportKey   String?                           // StoredFile / object key of the export
  evalRunId   String?                           // model-impact linkage (below)
}

// ── Model-impact feedback loop ──
model EvalRun {
  id          String   @id @default(cuid())
  releaseId   String?
  target      String                            // model / eval suite
  metrics     Json                              // eval lift, regressions, failure clusters
  createdAt   DateTime @default(now())
}
```

**Reused as-is:** `Entity`/`Membership` (client + vendor orgs), `Team`/`TeamMembership` (workforce pods), `TaskerProfile`/`TaskerLevel` (worker/expert tiers), `StoredFile` (ACL-brokered artifacts), `AuditLog`, `QcDecision`, `Comment.visibility`, `Payout`/`TimeEntry`/`UsageRecord` (economics).

**Extends:** `QcReview` gains `defects DefectCode[]` so the taxonomy works on the existing work plane too (immediate quick win, independent of the rest).

---

## 6. Lifecycle & gates (Batch state machine)

```
DRAFT → TASK_DESIGN → PILOT → CALIBRATION ─(pass)→ PRODUCTION
        → IN_REVIEW → QA_AUDIT → CLIENT_ACCEPTANCE → ACCEPTED → RELEASED
                                                   ↘ (rework) → REWORK batch
```

- **Calibration gate:** cannot enter `PRODUCTION` until annotator/reviewer agreement on the pilot clears threshold (inter-annotator agreement; gold accuracy).
- **Client-acceptance gate:** new, explicit — `CLIENT_ACCEPTANCE` with an SLA "deemed-accepted" timer (uses `Comment.visibility=CLIENT` + notifications).
- **Release gate:** see §7.

The existing `TaskStatus` machine is unchanged; `Item`/`Batch` get their own.

---

## 7. Release gates (objective, not "done")

A `Release` moves to `PASSED` only when all gates pass; results stored in `Release.gateResults`:

| Gate | Threshold (configurable) |
| --- | --- |
| Schema validation | 100% items pass output-schema check |
| Required metadata | 100% present (rubric/schema version, reviewer, …) |
| Critical defect rate | 0% / agreed tolerance (from `DefectCode` severity) |
| Reviewer completion | 100% of required workflow |
| QA audit sample | Completed (risk-based, §8) |
| Expert adjudication | Completed for escalated items |
| Client acceptance | Approved or SLA-deemed |
| Dataset card | Present (`Release.datasetCard`) |
| Model-impact check | Eval lift ≥ threshold *when feasible* (`EvalRun`) |

---

## 8. Quality controls

- **Defect taxonomy (§5)** → root-cause analytics (task design vs worker vs reviewer vs client ambiguity).
- **Risk-based sampling:** a `samplingPolicy` on `TaskType`/`Batch` (low → auto+sample; high → dual review; critical → 100% expert). Auto-raise sampling when: worker new, rubric changed, client escalation, high defect variance, reviewer false-approval rising, eval regression.
- **Gold tasks & calibration:** `Item.isGold` + `expected` (answer **and rationale** for subjective work). Drives worker certification, reviewer calibration, drift detection.
- **Agreement:** with `K>1`, compute consensus + an agreement score per item/worker/reviewer (grounds ground-truth and reviewer reliability).

---

## 9. Metrics (where each comes from)

| Level | Examples | Source |
| --- | --- | --- |
| Item | first-pass acceptance, revision/rejection rate, defect severity, agreement, time/item, schema-fail rate | `Item`, `Annotation.timeMs`, `Judgment.defects` |
| Worker | gold accuracy, reviewer-overturn, defect-by-category, throughput-at-quality, drift | `Annotation` + `Judgment` + gold `Item`s |
| Reviewer | false-approval, false-rejection, agreement-with-expert, latency | `Judgment` chains (`parentId`), QA audits |
| Batch | acceptance rate, critical-defect rate, **cost per accepted item**, cycle time, rework cost, eval impact | `Batch`/`Item` + `TimeEntry`/`Payout` + `EvalRun` |

> **Cost per accepted item = (labor + tooling + QA + rework) / accepted items** — computed from `TimeEntry`/`Payout`/`UsageRecord` over `accepted` `Item`s, *not* generated items. This is the metric that exposes rework and contractor inefficiency.

---

## 10. Phased roadmap

| Phase | Delivers | Depends on | Effort |
| --- | --- | --- | --- |
| **0 — Quick win** | `DefectCode` enum + `defects` on `QcReview`; defect analytics | — | S |
| **1 — Keystone** | `Batch` + `Item` + `Release` + release gates; `Task`-commissions-`Batch` | D1 | M |
| **2 — Contract** | `RubricVersion` + acceptance thresholds; link items/judgments to rubric version | 1 | M |
| **3 — Annotation plane** | `Annotation` (K-way) + `Judgment` + gold tasks + agreement/consensus | D2, 1 | L |
| **4 — Economics & dashboards** | item/worker/reviewer/batch metrics; cost-per-accepted-item; risk-based sampling | 1–3 | M |
| **5 — Model loop** | `EvalRun` linkage + model-impact release gate | 1, ext. eval system | L |

Phase 0 is independent and shippable immediately; Phases 1→3 are the spine.

---

## 11. Risks & open questions

- **Two planes, one app:** clear ownership needed so `Task` (work) and `Item` (data) don't blur. Mitigation: `Task` *commissions* `Batch`; they never share a lifecycle.
- **Volume:** millions of `Item`s → indexing, pagination, export streaming, partitioning. Needs a data-warehouse/export story (Phase 4).
- **PII/safety pre-screen** on `Item.input` before workers see it (extends `StoredFile` ACL model to item payloads).
- **Worker identity vs. `User`:** contractors at scale may not each be platform `User`s — decide whether `Annotation.workerId` references `User` or a lighter `Worker`/vendor-roster record.
- **Open:** D1 and D2 (the two decisions). Also: do we need per-item *versioning* of annotations (revision history) or is `Judgment`-driven revision enough?

## 12. References (grounding the framework)
- Google **Data Cards** → `Release.datasetCard` (structured dataset documentation from day one).
- **Inter-annotator agreement / consensus** (e.g. Label Studio) → §8 agreement, calibration gate.
- **NIST AI RMF** → measurement/monitoring as *operational governance* (§9 metrics, §7 gates), not final inspection.

## 13. Decisions & remaining sign-off
1. ✅ **D1** — item granularity → **lightweight `Item` plane** (decided 2026-06-20).
2. ✅ **D2** — redundancy → **hybrid `Annotation`, configurable `K`** (decided 2026-06-20).
3. ⬜ Ship **Phase 0 (defect taxonomy)** now as an independent quick win?
4. ⬜ Landing: where this doc lives — iterate → dedicated docs branch/PR, vs. onto the current branch.
