import Link from "next/link";

const sections = [
  {
    title: "Getting started",
    links: [
      ["/docs", "Overview"],
      ["/docs/architecture", "Architecture"],
      ["/docs/self-hosting", "Self-hosting & deploy"],
    ],
  },
  {
    title: "By role",
    links: [
      ["/docs/requestors", "For requestors"],
      ["/docs/taskers", "For taskers"],
      ["/docs/admins", "For dispatchers / admins"],
    ],
  },
  {
    title: "Reference",
    links: [
      ["/docs/api", "API & integrations"],
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container-px grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <nav className="space-y-6">
          {sections.map((s) => (
            <div key={s.title}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {s.title}
              </div>
              <ul className="space-y-1">
                {s.links.map(([href, label]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="block rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <article className="min-w-0">{children}</article>
    </div>
  );
}
