import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "For dispatchers & admins" };

export default function AdminsDoc() {
  return (
    <Prose>
      <h1>For dispatchers &amp; admins</h1>
      <p>
        Platform admins (dispatchers) run the operation: configure what work the
        platform accepts, route it, oversee the pipeline, run quality control,
        and manage payouts.
      </p>

      <h2>Designing task types</h2>
      <p>
        Create new task types and define their intake form field by field — text,
        number, date, select, checkbox, URL, or file upload — marking each as
        required or optional. File fields can restrict count and MIME types. Set a
        default budget, a required tasker level, and whether tasks auto-assign or
        require triage.
      </p>

      <h2>Routing &amp; reassignment</h2>
      <p>
        The triage queue shows everything awaiting assignment. Assign to a
        specific tasker, to any tasker of a given level, or to a team. Reassign at
        any time — the full assignment history is preserved for audit.
      </p>

      <h2>Pipeline &amp; analytics</h2>
      <p>
        The pipeline board groups tasks by status. Dashboards surface throughput,
        average cycle time, and actual-versus-plan cost across the operation, so
        you can spot bottlenecks early.
      </p>

      <h2>Quality control &amp; second opinions</h2>
      <p>
        When a tasker submits a deliverable, it enters QC. A reviewer scores it
        and decides: approve, request a revision, or <strong>escalate</strong> for
        a second opinion from another reviewer. Only after approval is the work
        delivered to the requestor.
      </p>

      <h2>Billing &amp; payouts</h2>
      <p>
        Subscriptions meter requestor usage against their plan&apos;s included
        tasks. On delivery, the platform computes the tasker payout — gross price
        minus the configured commission — and records it for settlement via
        Stripe Connect or your own process.
      </p>
    </Prose>
  );
}
