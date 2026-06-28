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
