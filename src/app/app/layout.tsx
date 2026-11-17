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

  const requestorItems = [
    { href: "/app", label: "Home" },
    { href: "/app/requestor", label: "My requests" },
    { href: "/app/requestor/new", label: "New request" },
  ];
  // Buyers (organisation members) get a read-only window into the data batches
  // their org has commissioned.
  if (ctx.entities.length > 0) {
    requestorItems.push({
      href: "/app/requestor/batches",
      label: "Data batches",
    });
  }

  const sections: NavSection[] = [
    {
      title: "Requestor",
      items: requestorItems,
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
        { href: "/app/admin/projects", label: "Projects" },
        { href: "/app/admin/triage", label: "Triage queue" },
        { href: "/app/admin/qc", label: "Quality control" },
        { href: "/app/admin/batches", label: "Data batches" },
        { href: "/app/admin/rubrics", label: "Rubrics" },
        { href: "/app/admin/metrics", label: "Data metrics" },
        { href: "/app/admin/task-types", label: "Task types" },
        { href: "/app/admin/analytics", label: "Analytics" },
        { href: "/app/admin/payouts", label: "Payouts" },
      ],
    });
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <aside className="sticky top-0 hidden h-screen w-64 flex-none flex-col border-r border-hairline lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/" className="flex items-center gap-2.5 font-medium text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-600 text-white shadow-sheen">
              <Workflow className="h-[18px] w-[18px]" />
            </span>
            <span className="font-display text-[17px] tracking-[-0.01em]">TaskFlow</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <Sidebar sections={sections} />
        </div>
        <div className="m-3 rounded-[14px] border border-hairline bg-white p-3 shadow-hairline">
          <div className="flex items-center gap-2.5 pb-2">
            <span
              aria-hidden
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-50 text-xs font-medium text-brand-700 ring-1 ring-brand-100"
            >
              {(ctx.name || ctx.email).slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">
                {ctx.name || ctx.email}
              </div>
              <div className="truncate font-mono text-[11px] text-muted">{ctx.email}</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-hairline bg-white/80 px-4 backdrop-blur-md lg:hidden">
          <Link href="/app" className="flex items-center gap-2.5 font-medium text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-600 text-white shadow-sheen">
              <Workflow className="h-[18px] w-[18px]" />
            </span>
            <span className="font-display text-[17px] tracking-[-0.01em]">TaskFlow</span>
          </Link>
          <SignOutButton />
        </header>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
