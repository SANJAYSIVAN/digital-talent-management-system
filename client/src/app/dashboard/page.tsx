"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  StoredUser,
} from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

type Task = {
  _id: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: "pending" | "in-progress" | "completed";
  createdAt: string;
};

const initialTaskForm = {
  title: "",
  description: "",
  dueDate: "",
};

const statusStyles: Record<Task["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  "in-progress": "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
};

const formatTaskDate = (value: string | null) => {
  if (!value) {
    return "No due date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No due date";
  }

  return date.toLocaleDateString();
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState(initialTaskForm);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const loadDashboardData = async () => {
      try {
        const [userResponse, tasksResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/tasks`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const userData = await userResponse.json();
        const tasksData = await tasksResponse.json();

        if (!userResponse.ok) {
          throw new Error(userData.message || "Could not fetch user data.");
        }

        if (!tasksResponse.ok) {
          throw new Error(tasksData.message || "Could not fetch tasks.");
        }

        setUser(userData.user);
        localStorage.setItem("user", JSON.stringify(userData.user));
        setTasks(tasksData);
      } catch (fetchError) {
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : "Could not load dashboard.";
        setError(errorMessage);
        clearAuthSession();
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTaskError("");

    if (!formData.title.trim() || !formData.description.trim()) {
      setTaskError("Title and description are required.");
      return;
    }

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          dueDate: formData.dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create task.");
      }

      setTasks((currentTasks) => [data, ...currentTasks]);
      setFormData(initialTaskForm);
    } catch (submitError) {
      const errorMessage =
        submitError instanceof Error ? submitError.message : "Could not create task.";
      setTaskError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="rounded-full bg-[var(--surface-strong)] px-6 py-3 text-sm font-medium text-slate-700 shadow">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_28%)]" />
      <section className="relative mx-auto w-full max-w-7xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[0_24px_90px_rgba(15,23,42,0.12)] sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              {user ? `${user.name}'s workspace` : "Dashboard"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Create tasks and track what needs to be done.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Total Tasks
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{tasks.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Pending
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {tasks.filter((task) => task.status === "pending").length}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Completed
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {tasks.filter((task) => task.status === "completed").length}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-2xl font-semibold text-slate-900">Create task</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Add a new task to your list.
            </p>

            <form onSubmit={handleCreateTask} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, title: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 outline-none ring-0 transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(15,118,110,0.12)]"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-32 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 outline-none ring-0 transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(15,118,110,0.12)]"
                  placeholder="Enter task details"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, dueDate: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 outline-none ring-0 transition focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(15,118,110,0.12)]"
                />
              </div>

              {taskError ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {taskError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-[var(--primary)] px-6 py-3.5 font-semibold text-white transition hover:bg-[var(--primary-dark)] hover:shadow-[0_12px_24px_rgba(15,118,110,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating task..." : "Create Task"}
              </button>
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Task list</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Your recently created tasks appear here.
                </p>
              </div>
              <span className="rounded-full bg-stone-200 px-4 py-2 text-sm font-medium text-slate-700">
                {tasks.length} items
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white px-6 py-10 text-center text-sm text-[var(--muted)]">
                No tasks yet. Create your first task from the form.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {tasks.map((task) => (
                  <article
                    key={task._id}
                    className="rounded-[1.5rem] border border-[var(--border)] bg-white p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {task.description}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[task.status]}`}
                      >
                        {task.status.replace("-", " ")}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                      <span className="rounded-full bg-stone-100 px-3 py-1">
                        Due: {formatTaskDate(task.dueDate)}
                      </span>
                      <span className="rounded-full bg-stone-100 px-3 py-1">
                        Created: {formatTaskDate(task.createdAt)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
