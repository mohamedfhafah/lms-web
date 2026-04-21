export default function Home() {
  const pillars = [
    "App Router foundation for a modern LMS experience",
    "Prisma + PostgreSQL data layer",
    "Auth and typed API tooling already selected",
    "Queueing and observability dependencies in place",
  ];

  return (
    <main className="min-h-screen px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <section className="grid gap-10 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.45)] backdrop-blur sm:p-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <p className="text-sm font-mono uppercase tracking-[0.35em] text-cyan-300">
              Learning Platform Scaffold
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                LMS Web
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                An early-stage learning management system architecture built to
                combine modern authentication, typed APIs, background jobs, and
                a Postgres-backed data model in a single Next.js codebase.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                Next.js
              </span>
              <span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-200">
                Prisma
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                Clerk
              </span>
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
                tRPC
              </span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
              Status
            </p>
            <p className="mt-4 text-2xl font-semibold text-white">
              Foundation phase
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              This repository is intentionally public as a portfolio scaffold.
              It documents the stack direction and the initial architecture,
              while feature implementation is still in progress.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {pillars.map((pillar) => (
            <article
              key={pillar}
              className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-6 text-slate-200"
            >
              <p className="text-base leading-7">{pillar}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
