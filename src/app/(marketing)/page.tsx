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
  Activity,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Versioned rubrics",
    body: "Write the data contract once: use case, unit of work, output schema, grading rubric, domain rules, and edge cases. Publish a new version when the rules change.",
  },
  {
    icon: Users,
    title: "K-way annotation",
    body: "Send each item to K experts. TaskFlow scores their agreement and auto-accepts items above the threshold you set.",
  },
  {
    icon: Gauge,
    title: "Gold items",
    body: "Mix items with known answers into a batch to certify annotators during the pilot and catch drift in production.",
  },
  {
    icon: ShieldCheck,
    title: "Layered review",
    body: "Review, second opinion, QA audit, and adjudication. Every rejection carries a defect code, such as factual error, safety miss, or hallucinated citation.",
  },
  {
    icon: GitBranch,
    title: "Release gates",
    body: "Schema checks, critical-defect rate, review completion, and client acceptance. A batch ships as a versioned release with a dataset card only when every gate passes.",
  },
  {
    icon: Activity,
    title: "Model-impact loop",
    body: "Record eval runs against each release and gate the next one on measured lift. Track cost per accepted item, so rework shows up in the numbers.",
  },
  {
    icon: Wallet,
    title: "Expert workforce",
    body: "Taskers are profiled by skill and level and can work in teams. They are paid per hour or per task, with the platform commission deducted automatically.",
  },
  {
    icon: Lock,
    title: "Private and self-hostable",
    body: "No file sits at a public URL, and every download is checked against access rules. Runs on PostgreSQL and S3-compatible storage, on Vercel or your own servers.",
  },
];

const steps = [
  {
    role: "Client",
    title: "Define the data",
    body: "Set the use case, output schema, rubric, and edge cases. Every item is judged against a specific rubric version.",
  },
  {
    role: "Operations",
    title: "Pilot & calibrate",
    body: "Run a pilot batch with gold items and check agreement, then move to production with K annotators per item and an audit sample rate.",
  },
  {
    role: "Experts",
    title: "Annotate & review",
    body: "Domain experts work item by item. High-agreement items are accepted; the rest go to review, QA audit, and adjudication.",
  },
  {
    role: "Client",
    title: "Accept the release",
    body: "Each release lists its gate results and dataset card. Accept it, then record eval results to see what the data did for your model.",
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
              Human data for AI · self-hostable
            </span>
            <h1 className="mt-7 text-balance text-5xl leading-[1.08] text-white sm:text-[74px]">
              Expert training data, released only when it passes.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/70">
              TaskFlow runs SFT, preference, eval, and safety data projects with
              domain experts. Set a versioned rubric, send each item to several
              annotators, and measure how often they agree. Each batch ships as a
              versioned release once its quality gates pass, and every item
              records who labelled it, who reviewed it, and which rubric applied.
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
              [ClipboardList, "Rubrics", "A versioned data contract per batch"],
              [Users, "Agreement", "K annotators per item, scored for consensus"],
              [GitBranch, "Release gates", "Nothing ships until every gate passes"],
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
              From rubric to release
            </h2>
            <p className="mt-4 text-pretty text-muted">
              Each hand-off goes into the audit log, so any item can be traced to
              its annotators, reviewers, and rubric version.
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
              Quality you can measure
            </h2>
            <p className="mt-4 text-pretty text-muted">
              Quality is tracked per item, per annotator, per reviewer, and per
              batch, from the first pilot to the last release.
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
              Three workspaces, one dataset
            </h2>
            <p className="mt-4 text-muted">
              Each role gets its own workspace. Members of a client organisation
              see only what that organisation allows.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                ["Clients", "AI teams that need data. Track batches, review gate results and dataset cards, and accept releases. Commission one-off expert projects with a budget and milestones."],
                ["Experts", "Domain specialists such as lawyers, researchers, and designers. Annotate items, claim project work, log time, document methods, and track earnings."],
                ["Operations", "The team running the work. Design batches and rubrics, calibrate annotators, run QA and adjudication, cut releases, and pay experts."],
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
              <span className="font-mono text-xs text-muted">Batch overview</span>
            </div>
            <div className="space-y-3 p-5">
              {[
                ["BX-1024 · Contract clause preferences", "Calibration", "bg-violet-100 text-violet-700"],
                ["BX-0987 · Finance SFT prompts", "In review", "bg-amber-100 text-amber-800"],
                ["BX-0951 · Safety red-team ratings", "QA audit", "bg-teal-100 text-teal-800"],
                ["BX-0902 · Citation checks", "Released", "bg-green-100 text-green-800"],
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
              Run your first pilot batch
            </h2>
            <p className="mt-3 text-lg text-white/60">
              The free plan includes 3 tasks a month. To self-host, run docker-compose up.
            </p>
          </div>
          <div className="flex flex-none gap-3">
            <Link href="/register" className="btn-primary btn-lg">
              Create free account <ArrowRight className="h-4 w-4" />
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
