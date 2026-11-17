import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl leading-tight">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="eyebrow">{label}</div>
      <div className="mt-3 font-display text-3xl font-medium tracking-[-0.015em] text-ink">
        {value}
      </div>
      {hint && <div className="mt-1.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-gray-300 bg-white/60 px-6 py-16 text-center">
      <h3 className="text-xl">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function FileLink({
  id,
  filename,
  size,
  className,
}: {
  id: string;
  filename: string;
  size?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/api/files/${id}`}
      target="_blank"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-3.5 py-1.5 text-sm transition-colors hover:border-gray-300 hover:bg-gray-50",
        className,
      )}
    >
      <FileText className="h-4 w-4 text-gray-400" />
      <span className="truncate">{filename}</span>
      {size !== undefined && (
        <span className="text-xs text-gray-400">{(size / 1024).toFixed(0)} KB</span>
      )}
    </Link>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
