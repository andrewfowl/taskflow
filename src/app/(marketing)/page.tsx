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
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-white" />
        <div className="container-px py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge bg-brand-100 text-brand-700">
              Managed task marketplace · self-hostable
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
              Turn incoming requests into{" "}
              <span className="text-brand-600">delivered work</span>.
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              TaskFlow collects task requests from your subscribers, routes them
              to the right people, tracks delivery against budget, runs quality
              control, and pays everyone — all on open infrastructure you fully
              control.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn-primary px-6 py-3 text-base">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/docs" className="btn-secondary px-6 py-3 text-base">
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
      <section id="how" className="border-t border-gray-100 bg-white py-20">
        <div className="container-px">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-3 text-gray-600">
              One pipeline, four hand-offs — every step tracked and auditable.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="card relative p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
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
      <section id="features" className="bg-gray-50 py-20">
        <div className="container-px">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Everything the operation needs</h2>
            <p className="mt-3 text-gray-600">
              From intake to payout, with governance for organisations and
              privacy for every uploaded file.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
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
      <section className="bg-white py-20">
        <div className="container-px grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Three interfaces, one platform</h2>
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
      <section className="bg-brand-600 py-16">
        <div className="container-px flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Ready to run your task operation?
            </h2>
            <p className="mt-2 text-brand-100">
              Spin it up in minutes, or self-host with one command.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/register" className="btn bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 text-base">
              Get started
            </Link>
            <Link href="/docs/self-hosting" className="btn border border-white/40 text-white hover:bg-brand-700 px-6 py-3 text-base">
              Self-host
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
