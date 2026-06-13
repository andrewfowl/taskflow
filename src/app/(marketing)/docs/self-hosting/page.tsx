import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "Self-hosting & deploy" };

export default function SelfHostingDoc() {
  return (
    <Prose>
      <h1>Self-hosting &amp; deploy</h1>
      <p>
        TaskFlow runs anywhere Node.js and PostgreSQL run. Two common paths are
        below: a one-command local stack, and a Vercel deployment.
      </p>

      <h2>Local / self-hosted (Docker)</h2>
      <p>
        The bundled <code>docker-compose.yml</code> starts PostgreSQL and MinIO
        (an S3-compatible store) so you can run the whole platform on one box.
      </p>
      <pre><code>{`# 1. Configure
cp .env.example .env        # set AUTH_SECRET, keep STORAGE_DRIVER=local or s3

# 2. Start dependencies (Postgres + MinIO)
docker compose up -d

# 3. Install, migrate, seed
pnpm install
pnpm db:deploy              # apply migrations
pnpm db:seed                # demo data + accounts

# 4. Run
pnpm dev                    # http://localhost:3000`}</code></pre>

      <h2>Deploy to Vercel</h2>
      <ol>
        <li>Push this repo to GitHub and import it in Vercel.</li>
        <li>
          Provision a Postgres database (Vercel Postgres, Neon, or Supabase) and
          set <code>DATABASE_URL</code>.
        </li>
        <li>
          Set <code>AUTH_SECRET</code> (run <code>openssl rand -base64 32</code>),
          and storage variables: either <code>STORAGE_DRIVER=s3</code> with your
          bucket credentials, or use a provider like Cloudflare R2.
        </li>
        <li>
          Optionally set <code>PAYMENTS_DRIVER=stripe</code> with{" "}
          <code>STRIPE_SECRET_KEY</code> to enable billing.
        </li>
        <li>
          The build runs <code>prisma generate &amp;&amp; next build</code>. Run{" "}
          <code>pnpm db:deploy</code> against your production database once to
          create the schema.
        </li>
      </ol>
      <p>
        Note: the <code>local</code> storage driver writes to the container
        filesystem, which is ephemeral on Vercel. For production on Vercel use
        the <code>s3</code> driver with any S3-compatible bucket.
      </p>

      <h2>Environment variables</h2>
      <ul>
        <li><code>DATABASE_URL</code> — PostgreSQL connection string.</li>
        <li><code>AUTH_SECRET</code> — session signing secret.</li>
        <li><code>STORAGE_DRIVER</code> — <code>local</code> or <code>s3</code> (+ S3_* vars).</li>
        <li><code>PAYMENTS_DRIVER</code> — <code>manual</code> or <code>stripe</code> (+ STRIPE_* vars).</li>
        <li><code>PLATFORM_COMMISSION_RATE</code> — e.g. <code>0.15</code> for 15%.</li>
      </ul>
    </Prose>
  );
}
