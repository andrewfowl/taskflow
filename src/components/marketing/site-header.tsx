import Link from "next/link";
import { Workflow } from "lucide-react";
import { auth } from "@/lib/auth";

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="container-px flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
            <Workflow className="h-5 w-5" />
          </span>
          <span className="text-lg">TaskFlow</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
          <Link href="/#how" className="transition-colors hover:text-gray-900">
            How it works
          </Link>
          <Link
            href="/#features"
            className="transition-colors hover:text-gray-900"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="transition-colors hover:text-gray-900"
          >
            Pricing
          </Link>
          <Link href="/docs" className="transition-colors hover:text-gray-900">
            Docs
          </Link>
        </nav>
        <div className="flex items-center gap-3">
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
