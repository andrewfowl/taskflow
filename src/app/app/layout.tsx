import Link from "next/link";
import { redirect } from "next/navigation";
import { Workflow } from "lucide-react";
import { getViewerContext } from "@/lib/session";
import { Sidebar, type NavSection } from "@/components/app/sidebar";
import { SignOutButton } from "@/components/app/sign-out";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const sections: NavSection[] = [
    {
      title: "Requestor",
      items: [
        { href: "/app", label: "Home" },
        { href: "/app/requestor", label: "My requests" },
        { href: "/app/requestor/new", label: "New request" },
      ],
    },
  ];

  if (ctx.isTasker) {
    sections.push({
      title: "Tasker",
      items: [
        { href: "/app/tasker", label: "My work" },
        { href: "/app/tasker/available", label: "Available tasks" },
        { href: "/app/tasker/annotate", label: "Annotate" },
        { href: "/app/tasker/teams", label: "Teams" },
        { href: "/app/tasker/methodologies", label: "Methodologies" },
        { href: "/app/tasker/earnings", label: "Earnings" },
        { href: "/app/tasker/profile", label: "Profile & skills" },
      ],
    });
  }

  if (ctx.isPlatformAdmin) {
    sections.push({
      title: "Dispatcher",
      items: [
        { href: "/app/admin", label: "Pipeline" },
        { href: "/app/admin/triage", label: "Triage queue" },
        { href: "/app/admin/qc", label: "Quality control" },
        { href: "/app/admin/batches", label: "Data batches" },
        { href: "/app/admin/task-types", label: "Task types" },
        { href: "/app/admin/analytics", label: "Analytics" },
        { href: "/app/admin/payouts", label: "Payouts" },
      ],
    });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 flex-none flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-gray-100 px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Workflow className="h-5 w-5" />
            </span>
            TaskFlow
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Sidebar sections={sections} />
        </div>
        <div className="border-t border-gray-100 p-4">
          <div className="px-3 pb-2">
            <div className="truncate text-sm font-medium text-gray-900">
              {ctx.name || ctx.email}
            </div>
            <div className="truncate text-xs text-gray-500">{ctx.email}</div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <Link href="/app" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Workflow className="h-5 w-5" />
            </span>
            TaskFlow
          </Link>
          <SignOutButton />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
