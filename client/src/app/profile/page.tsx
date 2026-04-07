"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { clearAuthSession, getStoredToken, getStoredUser, setAuthSession } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

type ProfileForm = {
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  skills: string;
  joinedDate: string;
};

const initialForm: ProfileForm = {
  name: "",
  email: "",
  role: "",
  department: "",
  designation: "",
  skills: "",
  joinedDate: "",
};

const toInputDate = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
};

export default function ProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProfileForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load profile.");
        }

        const user = data.user || storedUser;

        setFormData({
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
          department: user.department || "",
          designation: user.designation || "",
          skills: Array.isArray(user.skills) ? user.skills.join(", ") : "",
          joinedDate: toInputDate(user.joinedDate),
        });
      } catch (fetchError) {
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : "Could not load profile.";
        setError(errorMessage);
        clearAuthSession();
        setTimeout(() => {
          router.push("/login");
        }, 1200);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          department: formData.department.trim(),
          designation: formData.designation.trim(),
          skills: formData.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          joinedDate: formData.joinedDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update profile.");
      }

      setAuthSession(token, data.user);
      setMessage("Profile updated successfully.");
    } catch (submitError) {
      const errorMessage =
        submitError instanceof Error ? submitError.message : "Could not update profile.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="rounded-full bg-[var(--surface-strong)] px-6 py-3 text-sm font-medium text-slate-700 shadow">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_28%)]" />
      <section className="relative mx-auto w-full max-w-5xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[0_24px_90px_rgba(15,23,42,0.12)] sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
              Employee Profile
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Profile</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Keep your employee details and talent profile up to date.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-stone-100"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Role</p>
            <p className="mt-3 text-xl font-semibold capitalize text-slate-900">
              {formData.role}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Email</p>
            <p className="mt-3 break-all text-base font-semibold text-slate-900">
              {formData.email}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Joined Date
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-900">
              {formData.joinedDate || "Not set"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, department: event.target.value }))
                }
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
                placeholder="e.g. Product, Engineering, Operations"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, designation: event.target.value }))
                }
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
                placeholder="e.g. Frontend Developer"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800">Joined Date</label>
              <input
                type="date"
                value={formData.joinedDate}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, joinedDate: event.target.value }))
                }
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Skills
            </label>
            <textarea
              value={formData.skills}
              onChange={(event) =>
                setFormData((current) => ({ ...current, skills: event.target.value }))
              }
              className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
              placeholder="Enter skills separated by commas"
            />
          </div>

          {error ? (
            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[var(--primary)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
