import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getViewerContext } from "@/lib/session";
import { StatCard } from "@/components/app/ui";
import { StatusBadge } from "@/components/status-badge";
import { relativeTime } from "@/lib/utils";
import { becomeTasker } from "@/server/profile";
import { SubmitButton } from "@/components/app/submit-button";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const [myRequests, openRequests, assignedActive, triageCount, qcCount, recent] =
    await Promise.all([
      prisma.task.count({ where: { requestorId: ctx.id } }),
      prisma.task.count({
        where: { requestorId: ctx.id, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      }),
      ctx.isTasker
        ? prisma.task.count({
            where: {
              assigneeId: ctx.id,
              status: { in: ["ASSIGNED", "IN_PROGRESS", "REVISION_REQUESTED"] },
            },
          })
        : Promise.resolve(0),
      ctx.isPlatformAdmin
        ? prisma.task.count({ where: { status: "TRIAGE" } })
        : Promise.resolve(0),
      ctx.isPlatformAdmin
        ? prisma.task.count({
            where: { status: { in: ["SUBMITTED_FOR_QC", "QC_IN_REVIEW", "SECOND_OPINION"] } },
          })
        : Promise.resolve(0),
      prisma.task.findMany({
        where: { requestorId: ctx.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, reference: true, title: true, status: true, updatedAt: true },
      }),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back, {ctx.name ?? "there"}.</h1>
      <p className="mt-1 text-sm text-gray-600">
        Here&apos;s what&apos;s happening across your workspaces.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My requests" value={myRequests} hint={`${openRequests} open`} />
        {ctx.isTasker && <StatCard label="My active work" value={assignedActive} />}
        {ctx.isPlatformAdmin && <StatCard label="Awaiting triage" value={triageCount} />}
        {ctx.isPlatformAdmin && <StatCard label="In quality control" value={qcCount} />}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h2 className="font-semibold">Recent requests</h2>
              <Link href="/app/requestor" className="text-sm font-medium text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-500">
                You haven&apos;t created any requests yet.{" "}
                <Link href="/app/requestor/new" className="font-medium text-brand-600 hover:underline">
                  Create one →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recent.map((t) => (
                  <li key={t.id}>
                    <Link href={`/app/tasks/${t.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{t.title}</div>
                        <div className="text-xs text-gray-500">
                          {t.reference} · {relativeTime(t.updatedAt)}
                        </div>
                      </div>
                      <StatusBadge status={t.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Link href="/app/requestor/new" className="card flex items-center justify-between p-5 hover:bg-gray-50">
            <div>
              <div className="font-semibold">New request</div>
              <div className="text-sm text-gray-500">Submit a task to the platform</div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>

          {ctx.isTasker ? (
            <Link href="/app/tasker/available" className="card flex items-center justify-between p-5 hover:bg-gray-50">
              <div>
                <div className="font-semibold">Find work</div>
                <div className="text-sm text-gray-500">Browse open tasks to claim</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          ) : (
            <form action={becomeTasker} className="card p-5">
              <div className="font-semibold">Work as a tasker</div>
              <p className="mt-1 text-sm text-gray-500">
                Enable the tasker workspace to receive and deliver work.
              </p>
              <div className="mt-3">
                <SubmitButton className="btn-secondary">Enable tasker mode</SubmitButton>
              </div>
            </form>
          )}

          {ctx.entities.length > 0 && (
            <div className="card p-5">
              <div className="font-semibold">Your organisations</div>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {ctx.entities.map((e) => (
                  <li key={e.id} className="flex items-center justify-between">
                    <span>{e.name}</span>
                    <span className="badge bg-gray-100 text-gray-600">{e.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
