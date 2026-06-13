import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "Documentation" };

export default function DocsOverview() {
  return (
    <Prose>
      <h1>Documentation</h1>
      <p>
        TaskFlow is a managed task-marketplace platform. Requestors submit work,
        dispatchers route it, taskers deliver it, and quality control gates the
        output before it reaches the requestor — with budgets, time tracking,
        teams, and payouts wired through the whole pipeline.
      </p>

      <h2>The lifecycle of a task</h2>
      <ol>
        <li>
          A <strong>requestor</strong> picks a task type and fills in the brief.
          Each task type defines its own required and optional fields, including
          file uploads.
        </li>
        <li>
          The task enters <strong>triage</strong>. A dispatcher assigns it to a
          tasker or team by skill and level — or it auto-assigns if the task
          type allows.
        </li>
        <li>
          The <strong>tasker</strong> proposes a budget/plan (hourly or fixed,
          with milestones). The requestor approves it and tracks actuals against
          it.
        </li>
        <li>
          The tasker logs time, documents the work with a{" "}
          <strong>methodology</strong>, and submits deliverables for{" "}
          <strong>quality control</strong>.
        </li>
        <li>
          QC scores the work and either approves it, requests a revision, or
          escalates for a <strong>second opinion</strong>.
        </li>
        <li>
          Once approved, the deliverable is released to the requestor and a{" "}
          <strong>payout</strong> is created for the tasker, net of platform
          commission.
        </li>
      </ol>

      <h2>Pick your path</h2>
      <ul>
        <li><Link href="/docs/requestors">For requestors</Link> — submitting and tracking work.</li>
        <li><Link href="/docs/taskers">For taskers</Link> — teams, plans, time, deliverables.</li>
        <li><Link href="/docs/admins">For dispatchers</Link> — routing, QC, task types, payouts.</li>
        <li><Link href="/docs/architecture">Architecture</Link> — how it&apos;s built and why.</li>
        <li><Link href="/docs/self-hosting">Self-hosting</Link> — run it anywhere.</li>
      </ul>
    </Prose>
  );
}
