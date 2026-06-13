"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };
export type NavSection = { title: string; items: NavItem[] };

export function Sidebar({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {section.title}
          </div>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm font-medium",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
