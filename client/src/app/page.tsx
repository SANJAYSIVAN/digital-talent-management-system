import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="grid w-full max-w-5xl gap-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#115e59,#0f766e,#134e4a)] p-8 text-white">
          <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight">
            Digital Talent Management System
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-emerald-50/90">
            Register, login, and access the dashboard securely.
          </p>
          <div className="mt-8 grid gap-4 text-sm text-emerald-50/90 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">Register</div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">Login</div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">Dashboard</div>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-[1.5rem] bg-[var(--surface)] p-8">
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Get started</h2>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            Create an account or sign in to continue.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            <Link
              href="/register"
              className="rounded-full bg-[var(--primary)] px-6 py-3 text-center font-semibold text-white transition hover:bg-[var(--primary-dark)]"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-[var(--border)] px-6 py-3 text-center font-semibold text-slate-900 transition hover:bg-stone-100"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
