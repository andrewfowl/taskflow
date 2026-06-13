import { prisma } from "@/lib/db";

// Lightweight audit + notification helpers used by server actions. Centralising
// them keeps side effects consistent and makes the pipeline observable.

export async function audit(opts: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: opts.actorId ?? null,
      action: opts.action,
      targetType: opts.targetType,
      targetId: opts.targetId,
      meta: (opts.meta ?? undefined) as object | undefined,
    },
  });
}

export async function notify(opts: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  if (!opts.userId) return;
  await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link,
    },
  });
}
