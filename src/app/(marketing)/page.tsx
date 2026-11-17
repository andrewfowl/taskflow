import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Users,
  ShieldCheck,
  GitBranch,
  Gauge,
  Wallet,
  Lock,
  Boxes,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Configurable intake",
    body: "Define new task types with exactly the required and optional inputs — text, dates, selects, and file uploads — that requestors must provide.",
  },
  {
    icon: GitBranch,
    title: "Smart routing",
    body: "Auto-assign by skill and level, or send to a dispatcher for triage. Reassign in one click and keep a full assignment history.",
  },
  {
    icon: Users,
    title: "Teams & taskers",
    body: "Taskers build teams, invite collaborators, and share access. Work is documented with reusable, tasker-defined methodologies.",
  },
  {
    icon: Gauge,
    title: "Plans vs. actuals",
    body: "Taskers submit a budget and milestones; requestors approve and watch real time and cost track against the plan, live.",
  },
  {
    icon: ShieldCheck,
    title: "Quality control",
    body: "Every deliverable runs through QC with scoring, revisions, and an optional second-opinion reviewer before it reaches the requestor.",
  },
  {
    icon: Wallet,
    title: "Billing & payouts",
    body: "Usage-based subscriptions for requestors, hourly or fixed compensation for taskers, and an automatic platform commission split.",
  },
  {
    icon: Lock,
    title: "Locked-down files",
    body: "Uploads are never public. Access is brokered per request — only admins, the assigned tasker, and authorised team members can read them.",
  },
  {
    icon: Boxes,
    title: "No vendor lock-in",
    body: "PostgreSQL, the S3 API, and self-hosted auth. Run it on Vercel, or docker-compose up on your own box. Your data stays yours.",
  },
];

const steps = [
  {
    role: "Requestor",
    title: "Submit a request",
    body: "Pick a task type, fill in the brief, and upload supporting files. Standalone or on behalf of your organisation.",
  },
  {
    role: "Dispatcher",
    title: "Triage & assign",
    body: "Review the queue, match work to the right tasker or team by skill and level, and set the budget guardrails.",
  },
  {
    role: "Tasker",
    title: "Plan & deliver",
    body: "Propose a budget, log time against it, document the work, and submit deliverables for quality control.",
  },
  {
    role: "QC + Requestor",
    title: "Review & deliver",
    body: "QC scores the work, escalates for a second opinion if needed, then releases the approved output to the requestor.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-20 overflow-hidden bg-void pt-20 text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#ffffff_0%,#c7d2fe_14%,#6366f1_36%,#3730a3_58%,#1e1b4b_78%,#0a0a1f_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(180deg,transparent_25%,black_60%,transparent)]"
        />
        <div className="container-px pb-24 pt-28 sm:pb-32 sm:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-3 py-1 text-ink backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
              Managed task marketplace · self-hostable
            </span>
            <h1 className="mt-7 text-balance text-5xl leading-[1.08] text-white sm:text-[74px]">
              Turn incoming requests into delivered work.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/70">
              TaskFlow collects task requests from your subscribers, routes them
              to the right people, tracks delivery against budget, runs quality
              control, and pays everyone — all on open infrastructure you fully
              control.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn-primary btn-lg">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="btn btn-lg border border-white/30 text-white hover:bg-white/10"
              >
                Read the docs
              </Link>
            </div>
            <p className="mt-4 font-mono text-xs text-white/50">
              No credit card required · Free tier includes 3 tasks per month
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl divide-y divide-white/10 rounded-[20px] border border-white/10 bg-white/[0.04] backdrop-blur sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              [ClipboardList, "Intake", "Structured briefs per task type"],
              [ShieldCheck, "Quality control", "Scored reviews before delivery"],
              [Wallet, "Payouts", "Commission split automatically"],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof ClipboardList;
              return (
                <div key={title as string} className="flex items-start gap-3 p-5 text-left">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-white/10 ring-1 ring-white/15">
                    <I className="h-5 w-5 text-white" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">{title as string}</span>
                    <span className="mt-0.5 block text-sm text-white/60">{body as string}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white py-20 sm:py-28">
        <div className="container-px">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow-tag">How it works</span>
            <h2 className="heading-display mt-5 text-balance text-4xl leading-[1.14] sm:text-5xl">
              One pipeline, four hand-offs
            </h2>
            <p className="mt-4 text-pretty text-muted">
              Every step tracked and auditable.
            </p>
          </div>
          <div className="mt-14 grid gap-3 md:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="card relative p-6 transition-shadow hover:shadow-card-hover"
              >
                <div className="font-mono text-xs text-muted">
                  {String(i + 1).padStart(2, "0")} / {s.role}
                </div>
                <div className="mt-6 font-display text-2xl font-medium tracking-[-0.01em]">
                  {s.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-hairline bg-gray-50 py-20 sm:py-28">
        <div className="container-px">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow-tag bg-white">Features</span>
            <h2 className="heading-display mt-5 text-balance text-4xl leading-[1.14] sm:text-5xl">
              Everything the operation needs
            </h2>
            <p className="mt-4 text-pretty text-muted">
              From intake to payout, with governance for organisations and
              privacy for every uploaded file.
            </p>
          </div>
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="card p-6 transition-shadow hover:shadow-card-hover"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-brand-100 bg-brand-50 text-brand-600">
                  <f.icon className="h-5 w-5" />
                </span>
                <div className="mt-5 font-medium">{f.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles / interfaces */}
      <section className="bg-white py-20 sm:py-24">
        <div className="container-px grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="eyebrow-tag">Roles</span>
            <h2 className="heading-display mt-5 text-balance text-4xl leading-[1.14] sm:text-5xl">
              Three interfaces, one platform
            </h2>
            <p className="mt-4 text-muted">
              Each role gets a workspace built for the job — and entity members
              only ever see what their organisation permits.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                ["Requestors", "Submit and track tasks, approve budgets, download approved deliverables."],
                ["Taskers", "Claim work, build teams, plan budgets, log time, document with methodologies, and submit for QC."],
                ["Dispatchers / Admins", "Oversee the pipeline, assign and reassign, configure task types, run QC and second opinions, and manage payouts."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand-600" />
                  <span>
                    <span className="font-semibold">{t}.</span>{" "}
                    <span className="text-gray-600">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-[14px] border border-hairline bg-white shadow-float">
            <div className="flex items-center gap-3 border-b border-hairline bg-gray-50 px-4 py-2.5">
              <span aria-hidden className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc20]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </span>
              <span className="font-mono text-xs text-muted">Pipeline overview</span>
            </div>
            <div className="space-y-3 p-5">
              {[
                ["TF-9X2 · Quarterly market report", "QC in review", "bg-teal-100 text-teal-800"],
                ["TF-7KP · Logo redesign", "In progress", "bg-amber-100 text-amber-800"],
                ["TF-4MZ · Contract review", "Assigned", "bg-violet-100 text-violet-700"],
                ["TF-2QD · Data cleanup", "Delivered", "bg-green-100 text-green-800"],
              ].map(([title, status, tone]) => (
                <div
                  key={title}
                  className="flex items-center justify-between rounded-[10px] border border-hairline px-4 py-3"
                >
                  <span className="text-sm">
                    <span className="font-mono text-xs text-muted">{title.split(" · ")[0]}</span>{" "}
                    <span className="font-medium">{title.split(" · ")[1]}</span>
                  </span>
                  <span className={`badge ${tone}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white pb-20 sm:pb-28">
        <div className="container-px">
        <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[32px] bg-[linear-gradient(160deg,#3730a3_0%,#1e1b4b_55%,#0a0a1f_100%)] px-8 py-14 text-center sm:flex-row sm:px-14 sm:text-left">
          <div>
            <h2 className="heading-display text-balance text-4xl leading-[1.14] text-white">
              Ready to run your task operation?
            </h2>
            <p className="mt-3 text-lg text-white/60">
              Spin it up in minutes, or self-host with one command.
            </p>
          </div>
          <div className="flex flex-none gap-3">
            <Link href="/register" className="btn-primary btn-lg">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs/self-hosting"
              className="btn btn-lg border border-white/30 text-white hover:bg-white/10"
            >
              Self-host
            </Link>
          </div>
        </div>
        </div>
      </section>
    </>
  );
}
