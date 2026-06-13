import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "API & integrations" };

export default function ApiDoc() {
  return (
    <Prose>
      <h1>API &amp; integrations</h1>
      <p>
        The app exposes a small set of authenticated route handlers in addition
        to its server actions. All routes require a valid session and enforce the
        same access-control rules as the UI.
      </p>

      <h2>Files</h2>
      <ul>
        <li><code>POST /api/files</code> — multipart upload. Body: <code>file</code>, <code>taskId</code>, optional <code>fieldId</code>, <code>scope</code>. Stores bytes via the configured storage driver and records a <code>StoredFile</code>.</li>
        <li><code>GET /api/files/:id</code> — streams a file&apos;s bytes after checking the caller&apos;s access. Returns 403 if not permitted.</li>
      </ul>

      <h2>Health</h2>
      <ul>
        <li><code>GET /api/health</code> — liveness probe; verifies the database connection.</li>
      </ul>

      <h2>Payments webhook</h2>
      <ul>
        <li><code>POST /api/webhooks/stripe</code> — receives Stripe events (subscription status, checkout completion) when <code>PAYMENTS_DRIVER=stripe</code>.</li>
      </ul>

      <h2>Extending</h2>
      <p>
        Because the domain logic lives in server actions and typed library
        modules, adding a JSON API or webhooks for your own systems is
        straightforward — reuse <code>lib/access.ts</code> for authorisation and
        the Prisma client for data access.
      </p>
    </Prose>
  );
}
