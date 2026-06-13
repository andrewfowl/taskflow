import Link from "next/link";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { relativeTime } from "@/lib/utils";

export type TaskListItem = {
  id: string;
  reference: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  updatedAt: Date;
  dueDate?: Date | null;
  taskType?: { name: string } | null;
  assignee?: { name: string | null } | null;
  requestor?: { name: string | null } | null;
};

const priorityTone: Record<TaskPriority, string> = {
  LOW: "text-gray-400",
  NORMAL: "text-gray-500",
  HIGH: "text-orange-600",
  URGENT: "text-rose-600 font-semibold",
};

export function TaskList({
  tasks,
  show = {},
}: {
  tasks: TaskListItem[];
  show?: { assignee?: boolean; requestor?: boolean; type?: boolean };
}) {
  if (tasks.length === 0) {
    return (
      <div className="card px-5 py-12 text-center text-sm text-gray-500">
        No tasks to show.
      </div>
    );
  }
  return (
    <div className="card divide-y divide-gray-100">
      {tasks.map((t) => (
        <Link
          key={t.id}
          href={`/app/tasks/${t.id}`}
          className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-gray-900">{t.title}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
              <span>{t.reference}</span>
              {show.type && t.taskType && <span>· {t.taskType.name}</span>}
              {show.assignee && (
                <span>· {t.assignee?.name ? `Assigned: ${t.assignee.name}` : "Unassigned"}</span>
              )}
              {show.requestor && t.requestor && <span>· By {t.requestor.name}</span>}
              <span>·</span>
              <span className={priorityTone[t.priority]}>{t.priority}</span>
              <span>· updated {relativeTime(t.updatedAt)}</span>
            </div>
          </div>
          <StatusBadge status={t.status} />
        </Link>
      ))}
    </div>
  );
}
