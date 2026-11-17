"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };
export type NavSection = { title: string; items: NavItem[] };

export function Sidebar({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const activeHref = sections
    .flatMap((s) => s.items.map((i) => i.href))
    .filter(
      (href) =>
        pathname === href ||
        (href !== "/app" && pathname.startsWith(href + "/")),
    )
    .sort((a, b) => b.length - a.length)[0];
  return (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="eyebrow mb-2 px-3 text-gray-400">{section.title}</div>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-white font-medium text-ink shadow-float ring-1 ring-hairline"
                        : "text-muted hover:bg-white/70 hover:text-ink",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-1.5 w-1.5 flex-none rounded-full",
                        active ? "bg-brand-600" : "bg-transparent",
                      )}
                    />
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
