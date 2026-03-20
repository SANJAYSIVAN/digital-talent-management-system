"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  StoredUser,
} from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const cachedUser = getStoredUser();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (cachedUser) {
      setUser(cachedUser);
    }

    const loadUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not fetch user data.");
        }

        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (fetchError) {
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : "Could not fetch user data.";
        setError(errorMessage);
        clearAuthSession();
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="rounded-full bg-[var(--surface-strong)] px-6 py-3 text-sm font-medium text-slate-700 shadow">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-6 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_28%)]" />
      <section className="relative mx-auto w-full max-w-6xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-8 shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">
              {user ? `Hello, ${user.name}` : "Dashboard"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              You are logged in.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-full border border-[var(--border)] px-5 py-2 font-semibold text-slate-900 transition hover:bg-stone-100"
            >
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full bg-[var(--primary)] px-5 py-2 font-semibold text-white transition hover:bg-[var(--primary-dark)]"
            >
              Logout
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {user ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Name
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 break-words">
                {user.name}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Email
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-900 break-all">
                {user.email}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Role
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-[1.5rem] bg-[linear-gradient(135deg,#0f766e,#115e59)] p-7 text-white">
          <h2 className="text-2xl font-semibold">Session active</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/90">
            Your login token is valid.
          </p>
        </div>
      </section>
    </main>
  );
}
