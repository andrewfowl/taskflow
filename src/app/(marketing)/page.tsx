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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/70 via-white to-white" />
        <div
          aria-hidden
          className="absolute left-1/2 top-[-12%] -z-10 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent"
        />
        <div className="container-px py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-inset ring-brand-200 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Managed task marketplace · self-hostable
            </span>
            <h1 className="mt-6 text-balance text-5xl font-extrabold tracking-tight sm:text-7xl">
              Turn incoming requests into{" "}
              <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-800 bg-clip-text text-transparent">
                delivered work
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-gray-600 sm:text-xl">
              TaskFlow collects task requests from your subscribers, routes them
              to the right people, tracks delivery against budget, runs quality
              control, and pays everyone — all on open infrastructure you fully
              control.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="btn-primary btn-lg shadow-brand transition hover:-translate-y-0.5"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/docs" className="btn-secondary btn-lg">
                Read the docs
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required. Free tier includes 3 tasks per month.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-gray-100 bg-white py-20 sm:py-24">
        <div className="container-px">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-extrabold sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-pretty text-gray-600">
              One pipeline, four hand-offs — every step tracked and auditable.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="card relative p-6 transition-shadow hover:shadow-card-hover"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-base font-bold text-white shadow-sm">
                  {i + 1}
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-600">
                  {s.role}
                </div>
                <div className="mt-1 text-lg font-semibold">{s.title}</div>
                <p className="mt-2 text-sm text-gray-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20 sm:py-24">
        <div className="container-px">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-extrabold sm:text-4xl">
              Everything the operation needs
            </h2>
            <p className="mt-3 text-pretty text-gray-600">
              From intake to payout, with governance for organisations and
              privacy for every uploaded file.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="card p-6 transition-shadow hover:shadow-card-hover"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
                  <f.icon className="h-5 w-5" />
                </span>
                <div className="mt-4 font-semibold">{f.title}</div>
                <p className="mt-2 text-sm text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles / interfaces */}
      <section className="bg-white py-20 sm:py-24">
        <div className="container-px grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-balance text-3xl font-extrabold sm:text-4xl">
              Three interfaces, one platform
            </h2>
            <p className="mt-4 text-gray-600">
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
          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3 text-sm font-medium text-gray-500">
              Pipeline overview
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
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                >
                  <span className="text-sm font-medium">{title}</span>
                  <span className={`badge ${tone}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-brand-950 to-brand-900 py-20">
        <div
          aria-hidden
          className="absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-brand-500/30 blur-3xl"
        />
        <div className="container-px relative flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-balance text-3xl font-extrabold text-white sm:text-4xl">
              Ready to run your task operation?
            </h2>
            <p className="mt-3 text-lg text-brand-200">
              Spin it up in minutes, or self-host with one command.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="btn btn-lg bg-white text-brand-700 shadow-sm hover:bg-brand-50"
            >
              Get started
            </Link>
            <Link
              href="/docs/self-hosting"
              className="btn btn-lg border border-white/40 text-white hover:bg-white/10"
            >
              Self-host
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
