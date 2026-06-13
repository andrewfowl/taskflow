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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
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
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
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
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-gray-600">{description}</p>}
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
        "inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50",
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
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
