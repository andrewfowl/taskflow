import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "Architecture" };

export default function ArchitectureDoc() {
  return (
    <Prose>
      <h1>Architecture</h1>
      <p>
        TaskFlow is a single Next.js application (App Router, TypeScript) backed
        by PostgreSQL. It deploys cleanly to Vercel and runs equally well on your
        own server via Docker. Every external dependency sits behind an interface
        so you are never locked to one vendor.
      </p>

      <h2>Stack</h2>
      <ul>
        <li><strong>Next.js 15 + TypeScript</strong> — UI, server actions, and API route handlers in one deployable unit.</li>
        <li><strong>PostgreSQL + Prisma</strong> — the system of record. Works with Supabase, Neon, RDS, or self-hosted Postgres; no proprietary extensions.</li>
        <li><strong>Auth.js (self-hosted)</strong> — credentials are verified against your own database. Add OAuth/SAML providers without changing app code.</li>
        <li><strong>S3-compatible storage</strong> — file bytes live in any S3 API store (AWS S3, Cloudflare R2, MinIO, Wasabi) or on local disk.</li>
        <li><strong>Pluggable payments</strong> — Stripe by default, or a manual provider that records everything in your database.</li>
      </ul>

      <h2>Avoiding vendor lock-in</h2>
      <p>
        Three abstractions make the platform portable:
      </p>
      <ul>
        <li><code>StorageDriver</code> — <code>STORAGE_DRIVER=local|s3</code> swaps where files live.</li>
        <li><code>PaymentProvider</code> — <code>PAYMENTS_DRIVER=manual|stripe</code> swaps billing.</li>
        <li>Authentication runs in-process, so there is no third-party identity dependency.</li>
      </ul>
      <p>
        Because the data model is plain PostgreSQL, you can export, back up, or
        migrate it with standard tools at any time.
      </p>

      <h2>Access control</h2>
      <p>
        A single module (<code>lib/access.ts</code>) is the source of truth for
        authorisation. Every server action, page, and file route resolves a
        viewer&apos;s <code>TaskAccess</code> before doing anything. Uploaded
        files are never publicly addressable — bytes are streamed through an
        authenticated route only after an ACL check that considers the
        requestor, the assigned tasker, members of an assigned team with file
        access, entity managers, and platform admins.
      </p>

      <h2>Multi-tenancy</h2>
      <p>
        Users may be standalone or belong to one or more <strong>entities</strong>
        (organisations). Membership roles (<code>OWNER</code>, <code>ADMIN</code>,
        <code>BILLING</code>, <code>MEMBER</code>) determine whether a user sees
        only their own tasks or all of the entity&apos;s tasks. Subscriptions
        attach to either an entity or a standalone user — never both.
      </p>
    </Prose>
  );
}
