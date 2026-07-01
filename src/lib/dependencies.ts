import type { TaskStatus } from "@prisma/client";

// A prerequisite task stops blocking once it is delivered (or cancelled — it
// will never deliver, so it no longer holds up its dependents).
const SATISFIED: TaskStatus[] = ["DELIVERED", "CANCELLED"];

export function isSatisfied(status: TaskStatus): boolean {
  return SATISFIED.includes(status);
}

// References of a task's prerequisites that are not yet satisfied.
export function unmetDependencies(
  deps: { dependsOn: { reference: string; status: TaskStatus } }[],
): string[] {
  return deps
    .filter((d) => !isSatisfied(d.dependsOn.status))
    .map((d) => d.dependsOn.reference);
}

type RollupTask = {
  id: string;
  reference: string;
  dependencies: { dependsOn: { id: string } }[];
};

// The longest chain of in-project dependencies (the critical path), as an
// ordered list of task references (prerequisite first → final task). The
// dependency graph is acyclic (cycles are rejected on creation).
export function criticalPath(tasks: RollupTask[]): string[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const memo = new Map<string, string[]>();

  function chain(id: string): string[] {
    const cached = memo.get(id);
    if (cached) return cached;
    const t = byId.get(id);
    if (!t) return [];
    memo.set(id, []); // guard against a stray cycle
    let best: string[] = [];
    for (const dep of t.dependencies) {
      if (!byId.has(dep.dependsOn.id)) continue; // only in-project edges
      const c = chain(dep.dependsOn.id);
      if (c.length > best.length) best = c;
    }
    const result = [...best, t.reference];
    memo.set(id, result);
    return result;
  }

  let longest: string[] = [];
  for (const t of tasks) {
    const c = chain(t.id);
    if (c.length > longest.length) longest = c;
  }
  return longest;
}
