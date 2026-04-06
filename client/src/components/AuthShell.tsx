import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  children: ReactNode;
};

export default function AuthShell({
  title,
  description,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  children,
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.14),_transparent_30%)]" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[0_24px_90px_rgba(15,23,42,0.12)] lg:min-h-[650px] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="hidden bg-[linear-gradient(180deg,#0f766e,#115e59,#134e4a)] p-10 text-white lg:flex lg:flex-col lg:justify-center">
          <div>
            <h1 className="text-4xl font-semibold leading-tight">
              Digital Talent
              <br />
              Management System
            </h1>
          </div>
        </div>

        <div className="bg-[var(--surface)] p-6 sm:p-8 lg:flex lg:flex-col lg:justify-center lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
              {description}
            </p>

            <div className="mt-8">{children}</div>

            <p className="mt-7 text-center text-sm leading-6 text-[var(--muted)] sm:text-left">
              {footerText}{" "}
              <Link
                href={footerLinkHref}
                className="font-semibold text-[var(--primary)] transition hover:text-[var(--primary-dark)]"
              >
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
