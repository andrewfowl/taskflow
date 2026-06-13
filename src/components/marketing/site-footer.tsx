import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="container-px grid gap-8 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="text-lg font-semibold">TaskFlow</div>
          <p className="mt-2 max-w-xs text-sm text-gray-600">
            The open managed-services platform. Self-host it or run it on any
            cloud — no vendor lock-in.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">Product</div>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/#features" className="hover:text-gray-900">Features</Link></li>
            <li><Link href="/pricing" className="hover:text-gray-900">Pricing</Link></li>
            <li><Link href="/docs" className="hover:text-gray-900">Documentation</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">Roles</div>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/docs/requestors" className="hover:text-gray-900">For requestors</Link></li>
            <li><Link href="/docs/taskers" className="hover:text-gray-900">For taskers</Link></li>
            <li><Link href="/docs/admins" className="hover:text-gray-900">For dispatchers</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">Get started</div>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/register" className="hover:text-gray-900">Create account</Link></li>
            <li><Link href="/login" className="hover:text-gray-900">Sign in</Link></li>
            <li><Link href="/docs/self-hosting" className="hover:text-gray-900">Self-hosting</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <div className="container-px flex flex-col items-center justify-between gap-2 py-6 text-xs text-gray-500 sm:flex-row">
          <span>© {new Date().getFullYear()} TaskFlow. MIT-licensed.</span>
          <span>Built with Next.js, Prisma & PostgreSQL.</span>
        </div>
      </div>
    </footer>
  );
}
