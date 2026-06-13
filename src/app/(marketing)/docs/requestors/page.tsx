import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "For requestors" };

export default function RequestorsDoc() {
  return (
    <Prose>
      <h1>For requestors</h1>
      <p>
        Requestors submit work and track it through to delivery. You can act as
        an individual, or on behalf of an organisation (entity) you belong to.
      </p>

      <h2>Submitting a task</h2>
      <ol>
        <li>Open the requestor workspace and choose <strong>New request</strong>.</li>
        <li>Pick a <strong>task type</strong>. Each type shows its own form — required and optional fields, plus any file uploads the work needs.</li>
        <li>Set a due date and priority, then submit. Your files upload to private storage immediately.</li>
      </ol>

      <h2>Tracking progress</h2>
      <p>
        Every task has a timeline showing its current status, who&apos;s working
        on it, and client-visible comments. When a tasker submits a budget/plan,
        you&apos;ll see the estimated hours, rate or fixed price, and milestones —
        and you approve it before work proceeds.
      </p>

      <h2>Plan vs. actuals</h2>
      <p>
        Once work is underway, the task page compares the approved plan against
        actual time and cost logged by the tasker, so there are no surprises at
        delivery.
      </p>

      <h2>Receiving deliverables</h2>
      <p>
        Deliverables are only released to you once they pass quality control.
        Approved files appear in the task&apos;s deliverables section, available
        for download through an authenticated, access-controlled link.
      </p>

      <h2>Working as part of an entity</h2>
      <p>
        If you belong to an organisation, your tasks roll up to that entity.
        Entity owners and admins can see and oversee all tasks in the
        organisation; regular members see and manage their own. Billing is
        handled at the entity level.
      </p>
    </Prose>
  );
}
