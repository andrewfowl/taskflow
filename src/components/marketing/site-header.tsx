import Link from "next/link";
import { Workflow } from "lucide-react";
import { auth } from "@/lib/auth";

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center px-3 sm:px-4">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between rounded-full border border-hairline bg-white/85 pl-4 pr-2 shadow-float backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
        <Link href="/" className="flex items-center gap-2.5 font-medium text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-600 text-white shadow-sheen">
            <Workflow className="h-[18px] w-[18px]" />
          </span>
          <span className="font-display text-[17px] tracking-[-0.01em]">TaskFlow</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm text-muted md:flex">
          {[
            ["/#how", "How it works"],
            ["/#features", "Features"],
            ["/pricing", "Pricing"],
            ["/docs", "Docs"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-gray-100 hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          {session?.user ? (
            <Link href="/app" className="btn-primary">
              Open app
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
