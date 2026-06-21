import type { Prisma } from "@prisma/client";

// Inter-annotator agreement for an item's K annotations: the fraction sharing
// the most common (canonicalised) answer. Returns null when there are fewer
// than 2 annotations (nothing to measure yet). A simple consensus metric
// suited to categorical / preference / rating data. See docs/data-production.md.
export function computeAgreement(
  annotations: { data: Prisma.JsonValue }[],
): number | null {
  if (annotations.length < 2) return null;
  const counts = new Map<string, number>();
  for (const a of annotations) {
    const key = canonical(a.data);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const modal = Math.max(...counts.values());
  return modal / annotations.length;
}

// Stable stringification so {a:1,b:2} and {b:2,a:1} compare equal.
function canonical(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  const obj = v as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
    .join(",")}}`;
}
