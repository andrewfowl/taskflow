import { notFound, redirect } from "next/navigation";
import type { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getViewer } from "@/lib/session";
import { getTaskAccess } from "@/lib/access";
import { StatusBadge } from "@/components/status-badge";
import { Section, FileLink } from "@/components/app/ui";
import { formatCurrency, formatHours, relativeTime } from "@/lib/utils";
import { STATUS_TRANSITIONS } from "@/lib/constants";
import { AssignForm } from "./assign-form";
import {
  StatusButton,
  StartQcButton,
  DeliverButton,
  ProposePlanForm,
  DecidePlanButtons,
  LogTimeForm,
  SubmitDeliverableForm,
  QcReviewForm,
  SecondOpinionForm,
  CommentForm,
  AddMethodologyEntryForm,
} from "./task-forms";

export const dynamic = "force-dynamic";

const QC_MANAGED: TaskStatus[] = [
  "APPROVED",
  "REVISION_REQUESTED",
  "SECOND_OPINION",
  "DELIVERED",
  "QC_IN_REVIEW",
];

export default async function TaskDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { id } = await params;

  const access = await getTaskAccess(viewer, id);
  if (!access) notFound();

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      taskType: true,
      requestor: { select: { name: true, email: true } },
      assignee: { select: { name: true, email: true } },
      assignedTeam: { select: { name: true } },
      entity: { select: { name: true } },
      requiredSkills: true,
      fieldValues: { include: { field: true } },
      files: { orderBy: { createdAt: "asc" } },
      plans: { include: { milestones: { orderBy: { order: "asc" } }, tasker: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      timeEntries: { include: { tasker: { select: { name: true } } }, orderBy: { spentOn: "desc" } },
      deliverables: { include: { files: true, qcReviews: true }, orderBy: { version: "desc" } },
      qcReviews: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      assignments: { include: { assignee: { select: { name: true } }, team: { select: { name: true } }, assignedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      methodologyEntries: { include: { methodology: { select: { name: true } }, author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!task) notFound();

  // Aggregates: actuals vs plan.
  const totalMinutes = task.timeEntries.reduce((s, e) => s + e.minutes, 0);
  const actualCost = task.timeEntries.reduce((s, e) => s + Number(e.costAmount ?? 0), 0);
  const budgetAmount = task.budgetAmount ? Number(task.budgetAmount) : null;
  const budgetHours = task.budgetHours ? Number(task.budgetHours) : null;
  const costPct = budgetAmount ? Math.min(100, Math.round((actualCost / budgetAmount) * 100)) : null;

  const approvedPlan = task.plans.find((p) => p.status === "APPROVED");
  const proposedPlans = task.plans.filter((p) => p.status === "PROPOSED");
  const escalated = task.qcReviews.find((r) => r.decision === "ESCALATED" && r.kind === "PRIMARY_QC");
  const latestDeliverable = task.deliverables[0];

  const inputFiles = task.files.filter((f) => f.scope === "REQUESTOR_INPUT" || f.scope === "REFERENCE");

  // Comments: non-staff only see client-visible notes.
  const isStaffSide = access.canManage || access.canSubmitWork;
  const comments = isStaffSide ? task.comments : task.comments.filter((c) => c.visibility === "CLIENT");

  // Admin assignment data.
  const [taskers, teams] = access.canManage
    ? await Promise.all([
        prisma.user.findMany({
          where: { taskerProfile: { isNot: null } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 200,
        }),
        prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 200 }),
      ])
    : [[], []];

  // Methodologies the producer can use to document this task.
  const methodologies = access.canSubmitWork
    ? await prisma.methodology.findMany({
        where: { OR: [{ ownerId: viewer.id }, { isPublished: true }] },
        select: { id: true, name: true },
        take: 50,
      })
    : [];

  const allowedNext = STATUS_TRANSITIONS[task.status] ?? [];
  const adminButtons = allowedNext.filter((s) => !QC_MANAGED.includes(s));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main column */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{task.reference}</span>
            <span>·</span>
            <span>{task.taskType.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <StatusBadge status={task.status} />
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Requested by {task.requestor.name ?? task.requestor.email}
            {task.entity ? ` · ${task.entity.name}` : ""}
            {task.dueDate ? ` · due ${task.dueDate.toLocaleDateString()}` : ""}
          </div>
        </div>

        {/* Brief */}
        <Section title="Brief">
          {task.description ? (
            <p className="whitespace-pre-wrap text-sm text-gray-700">{task.description}</p>
          ) : (
            <p className="text-sm text-gray-400">No description provided.</p>
          )}
          {task.fieldValues.length > 0 && (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {task.fieldValues.map((fv) => (
                <div key={fv.id}>
                  <dt className="text-xs font-medium uppercase text-gray-400">{fv.field.label}</dt>
                  <dd className="text-sm text-gray-800">{String(fv.value)}</dd>
                </div>
              ))}
            </dl>
          )}
          {access.canAccessInputFiles && inputFiles.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-medium uppercase text-gray-400">Attachments</div>
              <div className="flex flex-wrap gap-2">
                {inputFiles.map((f) => (
                  <FileLink key={f.id} id={f.id} filename={f.filename} size={f.size} />
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Plan vs actuals */}
        <Section title="Plan & budget">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs uppercase text-gray-400">Budget</div>
              <div className="text-lg font-semibold">{formatCurrency(budgetAmount, task.currency)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400">Actual cost</div>
              <div className="text-lg font-semibold">{formatCurrency(actualCost, task.currency)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400">Time logged</div>
              <div className="text-lg font-semibold">
                {formatHours(totalMinutes)}
                {budgetHours ? <span className="text-sm font-normal text-gray-400"> / {budgetHours}h</span> : null}
              </div>
            </div>
          </div>
          {costPct !== null && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full ${costPct > 100 ? "bg-rose-500" : "bg-brand-500"}`}
                  style={{ width: `${Math.min(costPct, 100)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">{costPct}% of budget used</div>
            </div>
          )}

          {task.plans.length > 0 && (
            <div className="mt-5 space-y-3">
              {task.plans.map((p) => (
                <div key={p.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {p.pricingModel === "FIXED"
                        ? formatCurrency(p.fixedPrice ? Number(p.fixedPrice) : null, p.currency)
                        : `${formatCurrency(p.hourlyRate ? Number(p.hourlyRate) : null, p.currency)}/h × ${p.estimatedHours ?? "?"}h`}
                      <span className="ml-2 text-xs text-gray-400">by {p.tasker.name}</span>
                    </div>
                    <span className="badge bg-gray-100 text-gray-600">{p.status}</span>
                  </div>
                  {p.summary && <p className="mt-1 text-sm text-gray-600">{p.summary}</p>}
                  {p.milestones.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      {p.milestones.map((m) => (
                        <li key={m.id} className="flex justify-between">
                          <span>• {m.title}</span>
                          <span>{formatCurrency(m.amount ? Number(m.amount) : null, p.currency)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.status === "PROPOSED" && (access.isRequestor || access.isEntityManager || access.canManage) && (
                    <div className="mt-3">
                      <DecidePlanButtons planId={p.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {access.canSubmitWork && proposedPlans.length === 0 && !approvedPlan && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="mb-2 text-sm font-medium">Propose a plan</div>
              <ProposePlanForm taskId={task.id} />
            </div>
          )}
        </Section>

        {/* Time tracking */}
        {(access.canSubmitWork || access.canManage) && (
          <Section title="Time & resources">
            {access.canSubmitWork && (
              <div className="mb-4">
                <LogTimeForm taskId={task.id} />
              </div>
            )}
            {task.timeEntries.length === 0 ? (
              <p className="text-sm text-gray-400">No time logged yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {task.timeEntries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2">
                    <span>
                      {formatHours(e.minutes)} — {e.description ?? "work"}{" "}
                      <span className="text-gray-400">· {e.tasker.name}</span>
                    </span>
                    <span className="text-gray-500">{formatCurrency(e.costAmount ? Number(e.costAmount) : null)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* Deliverables */}
        <Section title="Deliverables">
          {access.canSubmitWork && ["IN_PROGRESS", "ASSIGNED", "REVISION_REQUESTED"].includes(task.status) && (
            <div className="mb-4 rounded-lg border border-dashed border-gray-300 p-4">
              <SubmitDeliverableForm taskId={task.id} />
            </div>
          )}
          {task.deliverables.length === 0 ? (
            <p className="text-sm text-gray-400">No deliverables submitted yet.</p>
          ) : (
            <ul className="space-y-3">
              {task.deliverables.map((d) => (
                <li key={d.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      v{d.version} · {d.title}
                    </div>
                    <span className="badge bg-gray-100 text-gray-600">{d.status}</span>
                  </div>
                  {d.notes && <p className="mt-1 text-sm text-gray-600">{d.notes}</p>}
                  {access.canAccessDeliverables ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {d.files.map((f) => (
                        <FileLink key={f.id} id={f.id} filename={f.filename} size={f.size} />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">
                      Files become available once the work is approved and delivered.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Quality control (staff) */}
        {access.canReviewQc && (
          <Section title="Quality control">
            {task.status === "SUBMITTED_FOR_QC" && (
              <div className="mb-4">
                <StartQcButton taskId={task.id} />
              </div>
            )}
            {task.status === "QC_IN_REVIEW" && (
              <div className="mb-4 rounded-lg border border-gray-200 p-4">
                <QcReviewForm taskId={task.id} deliverableId={latestDeliverable?.id} />
              </div>
            )}
            {task.status === "SECOND_OPINION" && (
              <div className="mb-4 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-4">
                <p className="mb-2 text-sm text-fuchsia-800">
                  This task was escalated for a second opinion.
                </p>
                <SecondOpinionForm taskId={task.id} parentReviewId={escalated?.id} />
              </div>
            )}
            {task.status === "APPROVED" && (
              <div className="mb-4">
                <DeliverButton taskId={task.id} />
              </div>
            )}
            {task.qcReviews.length > 0 && (
              <ul className="space-y-2 text-sm">
                {task.qcReviews.map((r) => (
                  <li key={r.id} className="rounded-lg border border-gray-100 p-2">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {r.kind === "SECOND_OPINION" ? "Second opinion" : "QC"} — {r.decision}
                        {r.score ? ` · ${r.score}/100` : ""}
                      </span>
                      <span className="text-gray-400">{r.reviewer.name} · {relativeTime(r.createdAt)}</span>
                    </div>
                    {r.comments && <p className="mt-1 text-gray-600">{r.comments}</p>}
                    {r.defects.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.defects.map((d) => (
                          <span
                            key={d}
                            className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700"
                          >
                            {d.replace(/_/g, " ").toLowerCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* Methodology documentation (staff) */}
        {isStaffSide && (
          <Section title="Work documentation">
            {access.canSubmitWork && methodologies.length > 0 && (
              <div className="mb-4 rounded-lg border border-dashed border-gray-300 p-4">
                <div className="mb-2 text-sm font-medium">Document with a methodology</div>
                <AddMethodologyEntryForm taskId={task.id} methodologies={methodologies} />
              </div>
            )}
            {task.methodologyEntries.length === 0 ? (
              <p className="text-sm text-gray-400">No documentation captured yet.</p>
            ) : (
              <ul className="space-y-2">
                {task.methodologyEntries.map((e) => (
                  <li key={e.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="text-sm font-medium">{e.methodology.name}</div>
                    <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
                      {JSON.stringify(e.data, null, 2)}
                    </pre>
                    <div className="text-xs text-gray-400">{e.author.name} · {relativeTime(e.createdAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* Comments */}
        <Section title="Activity & comments">
          <div className="mb-4">
            <CommentForm taskId={task.id} canChooseVisibility={isStaffSide} />
          </div>
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400">No comments yet.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.author.name}</span>
                    <span className="text-xs text-gray-400">{relativeTime(c.createdAt)}</span>
                    {c.visibility === "INTERNAL" && (
                      <span className="badge bg-gray-100 text-gray-500">internal</span>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-gray-700">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Actions */}
        <Section title="Actions">
          <div className="flex flex-wrap gap-2">
            {(access.isRequestor || access.isEntityManager) && task.status === "DRAFT" && (
              <StatusButton taskId={task.id} next="TRIAGE" label="Submit request" className="btn-primary" />
            )}
            {access.canSubmitWork && task.status === "ASSIGNED" && (
              <StatusButton taskId={task.id} next="IN_PROGRESS" label="Start work" className="btn-primary" />
            )}
            {access.canManage &&
              adminButtons.map((s) => (
                <StatusButton key={s} taskId={task.id} next={s} label={labelFor(s)} />
              ))}
          </div>
          {!access.canManage &&
            !(access.isRequestor && task.status === "DRAFT") &&
            !(access.canSubmitWork && task.status === "ASSIGNED") && (
              <p className="text-sm text-gray-400">No actions available right now.</p>
            )}
        </Section>

        {/* Assignment */}
        <Section title="Assignment">
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <span className="text-gray-400">Tasker: </span>
              {task.assignee?.name ?? "Unassigned"}
            </div>
            <div>
              <span className="text-gray-400">Team: </span>
              {task.assignedTeam?.name ?? "—"}
            </div>
            {task.requiredLevel && (
              <div>
                <span className="text-gray-400">Required level: </span>
                {task.requiredLevel}
              </div>
            )}
          </div>
          {access.canManage && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <AssignForm taskId={task.id} taskers={taskers} teams={teams} />
            </div>
          )}
          {task.assignments.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <div className="mb-1 text-xs font-medium uppercase text-gray-400">History</div>
              <ul className="space-y-1 text-xs text-gray-500">
                {task.assignments.map((a) => (
                  <li key={a.id}>
                    {a.assignee?.name ?? a.team?.name ?? "—"} · {a.status} · {relativeTime(a.createdAt)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function labelFor(status: TaskStatus): string {
  const map: Partial<Record<TaskStatus, string>> = {
    TRIAGE: "Send to triage",
    ASSIGNED: "Mark assigned",
    IN_PROGRESS: "Mark in progress",
    SUBMITTED_FOR_QC: "Send to QC",
    ON_HOLD: "Put on hold",
    CANCELLED: "Cancel",
    SUBMITTED: "Mark submitted",
  };
  return map[status] ?? status;
}
