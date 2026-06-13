# TaskFlow

A managed **task-marketplace platform**. It collects task requests from
subscribers, routes them to the right people, tracks delivery against budget,
runs quality control, and pays everyone — on open infrastructure you can
self-host with **no vendor lock-in**.

> Next.js 15 · TypeScript · PostgreSQL + Prisma · Auth.js · S3-compatible
> storage · pluggable payments.

---

## What it does

- **Intake** — Requestors submit tasks. Each **task type** defines its own
  required/optional fields, including file uploads, that admins configure.
- **Routing** — Auto-assign by skill/level, or send to a **dispatcher** for
  triage. Reassign anytime; full assignment history is kept.
- **Teams** — Taskers create teams and invite collaborators; access to a
  client's files is shared only with team members who are granted it.
- **Plans vs. actuals** — Taskers propose a budget/plan (hourly or fixed, with
  milestones). Requestors approve it and watch real time/cost track against it.
- **Quality control** — Deliverables run through QC with scoring, revisions, and
  an optional **second-opinion** reviewer before release.
- **Delivery & payouts** — Approved work is released to the requestor and a
  **payout** is generated for the tasker, net of a configurable platform
  commission.
- **Methodologies** — Taskers define reusable, structured templates to document
  how a class of work is performed.
- **Multi-tenancy** — Users can be standalone or belong to **entities**
  (organisations) with role-based oversight and entity-level billing.
- **Billing** — Usage-based subscriptions for requestors; hourly/fixed
  compensation for taskers; platform commission split.

Three first-class interfaces — **Requestor**, **Tasker**, **Dispatcher/Admin** —
plus a marketing site and documentation.

---

## Quick start (local)

Requirements: Node 20+, pnpm, Docker (for Postgres + MinIO).

```bash
# 1. Configure
cp .env.example .env
#   then set AUTH_SECRET (openssl rand -base64 32)

# 2. Start Postgres + MinIO
docker compose up -d

# 3. Install & set up the database
pnpm install
pnpm db:push        # create the schema from prisma/schema.prisma
pnpm db:seed        # demo data + accounts

# 4. Run
pnpm dev            # http://localhost:3000
```

### Demo accounts (password: `password123`)

| Email | Role |
| --- | --- |
| `admin@taskflow.dev` | Dispatcher / platform admin |
| `alex@taskflow.dev` | Tasker (senior, research) |
| `bru@taskflow.dev` | Tasker (designer) |
| `cara@taskflow.dev` | Tasker (legal) |
| `rita@example.com` | Requestor (individual) |
| `owner@acme.test` | Acme org owner |
| `member@acme.test` | Acme org member |

---

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repo in Vercel (it auto-detects Next.js).
3. Add a PostgreSQL database (Vercel Postgres, Neon, or Supabase) and set
   `DATABASE_URL`.
4. Set `AUTH_SECRET` and, for production file storage, `STORAGE_DRIVER=s3` with
   your S3/R2 bucket credentials. (The `local` driver uses the container
   filesystem, which is ephemeral on Vercel.)
5. Optionally set `PAYMENTS_DRIVER=stripe` and the `STRIPE_*` keys.
6. Deploy. Then run `pnpm db:deploy` (or `pnpm db:push`) against the production
   database once to create the schema.

The build command is `prisma generate && next build` (see `package.json`).

---

## Self-hosting (Docker)

```bash
docker compose up -d                 # Postgres + MinIO
docker build --build-arg BUILD_STANDALONE=true -t taskflow .
docker run --env-file .env -p 3000:3000 taskflow
```

Everything runs on open components — PostgreSQL, the S3 API, and in-process
auth — so you own your data end to end.

---

## No vendor lock-in, by design

| Concern | Abstraction | Swap with |
| --- | --- | --- |
| Database | Prisma + PostgreSQL | Supabase, Neon, RDS, self-hosted |
| File storage | `StorageDriver` (`STORAGE_DRIVER`) | local disk, AWS S3, R2, MinIO, Wasabi |
| Payments | `PaymentProvider` (`PAYMENTS_DRIVER`) | Stripe, or `manual` (DB-only) |
| Auth | Auth.js (self-hosted credentials) | add OAuth/SAML providers |

---

## Architecture & docs

In-app documentation lives at `/docs`. Highlights:

- `src/lib/access.ts` — the single source of truth for authorisation. Every
  page, server action, and file route resolves a viewer's `TaskAccess` first.
- File bytes are **never** public; downloads stream through
  `GET /api/files/:id` only after an ACL check.
- `src/server/*` — server actions for each domain (tasks, plans, work, qc,
  teams, methodologies, task types, payouts).
- `src/lib/storage/*` and `src/lib/payments/*` — the provider abstractions.

### Project layout

```
prisma/schema.prisma     # full data model
src/app/(marketing)/     # landing, pricing, /docs
src/app/(auth)/          # login & registration
src/app/app/             # authenticated app
  requestor/  tasker/  admin/  tasks/[id]
src/app/api/             # files, health, stripe webhook, auth
src/lib/                 # db, auth, access, storage, payments, utils
src/server/              # server actions (mutations)
src/components/          # UI
```

---

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run the dev server |
| `pnpm build` | `prisma generate` + production build |
| `pnpm db:push` | Sync schema to the database (no migration files) |
| `pnpm db:deploy` | Apply migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm typecheck` | Type-check the project |

## License

MIT.
