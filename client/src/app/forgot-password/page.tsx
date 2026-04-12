"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { API_BASE_URL } from "@/lib/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not start password reset.");
      }

      setMessage(data.message || "Password reset link generated successfully.");
      if (typeof data.resetUrl === "string" && data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (submitError) {
      const errorMessage =
        submitError instanceof Error
          ? submitError.message
          : "Could not start password reset.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      description="Enter your email to generate a reset link."
      footerText="Remembered your password?"
      footerLinkHref="/login"
      footerLinkLabel="Back to login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">Email</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
            placeholder="Enter your email"
          />
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {message ? (
          <div className="space-y-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p>{message}</p>
            {resetUrl ? (
              <Link
                href={resetUrl}
                className="inline-flex rounded-full bg-[var(--primary)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--primary-dark)]"
              >
                Open reset page
              </Link>
            ) : (
              <p className="text-emerald-700/90">
                If email delivery is enabled in production, the reset link should arrive in the
                user&apos;s inbox.
              </p>
            )}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-[var(--primary)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Preparing reset..." : "Generate reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
