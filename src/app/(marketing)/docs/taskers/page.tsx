import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "For taskers" };

export default function TaskersDoc() {
  return (
    <Prose>
      <h1>For taskers</h1>
      <p>
        Taskers do the work: claim or receive assignments, plan budgets, track
        time, document the work, and submit deliverables for quality control.
      </p>

      <h2>Your profile &amp; skills</h2>
      <p>
        Set your level (junior → expert), hourly rate, and skills. Dispatchers
        and the auto-router use these to match you to suitable work.
      </p>

      <h2>Teams</h2>
      <p>
        Create a team and invite other taskers. Tasks can be assigned to a whole
        team, and team members with file access can view the requestor&apos;s
        uploads even before an individual picks up the task. Team membership is
        how you safely share access to a client&apos;s materials.
      </p>

      <h2>Proposing a plan/budget</h2>
      <p>
        For each task, submit a plan: choose <strong>hourly</strong> (rate ×
        estimated hours) or <strong>fixed</strong> price, and break it into
        milestones. The requestor approves it, and it becomes the baseline your
        actuals are measured against.
      </p>

      <h2>Logging time &amp; resources</h2>
      <p>
        Record time entries as you work. Each entry can carry a cost, so the
        platform can show actual spend versus the approved plan and the original
        budget in real time.
      </p>

      <h2>Methodologies — document your work</h2>
      <p>
        Build reusable <strong>methodologies</strong>: structured templates
        (sections and fields) that describe how a class of work is performed. For
        a given task you fill in an entry against the methodology, producing
        consistent, reviewable documentation. Methodologies can be tied to a task
        type and shared with your team.
      </p>

      <h2>Submitting deliverables</h2>
      <p>
        Upload your output as a deliverable and submit it for QC. If QC requests
        a revision, you&apos;ll get the task back with comments; submit a new
        version. Once approved and delivered, a payout is generated for you — the
        agreed price minus the platform commission.
      </p>
    </Prose>
  );
}
