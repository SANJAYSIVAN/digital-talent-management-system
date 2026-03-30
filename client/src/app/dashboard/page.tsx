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
  createdBy?: {
    _id?: string;
    name: string;
    email: string;
    role: string;
  };
};

type TaskForm = {
  title: string;
  description: string;
  dueDate: string;
};

const initialTaskForm: TaskForm = {
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

const toInputDateValue = (value: string | null) => {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().split("T")[0];
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState<TaskForm>(initialTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<TaskForm>(initialTaskForm);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Task["status"]>("all");

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

  const getAuthToken = () => {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return null;
    }

    return token;
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTaskError("");

    if (!formData.title.trim() || !formData.description.trim()) {
      setTaskError("Title and description are required.");
      return;
    }

    const token = getAuthToken();

    if (!token) {
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

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task._id);
    setEditingForm({
      title: task.title,
      description: task.description,
      dueDate: toInputDateValue(task.dueDate),
    });
    setTaskError("");
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingForm(initialTaskForm);
    setTaskError("");
  };

  const handleUpdateTask = async (taskId: string) => {
    setTaskError("");

    if (!editingForm.title.trim() || !editingForm.description.trim()) {
      setTaskError("Title and description are required.");
      return;
    }

    const token = getAuthToken();

    if (!token) {
      return;
    }

    setActiveTaskId(taskId);

    try {
      const currentTask = tasks.find((task) => task._id === taskId);

      if (!currentTask) {
        throw new Error("Task not found.");
      }

      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingForm.title.trim(),
          description: editingForm.description.trim(),
          dueDate: editingForm.dueDate || null,
          status: currentTask.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update task.");
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task._id === taskId ? data : task))
      );
      cancelEditingTask();
    } catch (updateError) {
      const errorMessage =
        updateError instanceof Error ? updateError.message : "Could not update task.";
      setTaskError(errorMessage);
    } finally {
      setActiveTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTaskError("");

    const token = getAuthToken();

    if (!token) {
      return;
    }

    setActiveTaskId(taskId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete task.");
      }

      setTasks((currentTasks) => currentTasks.filter((task) => task._id !== taskId));

      if (editingTaskId === taskId) {
        cancelEditingTask();
      }
    } catch (deleteError) {
      const errorMessage =
        deleteError instanceof Error ? deleteError.message : "Could not delete task.";
      setTaskError(errorMessage);
    } finally {
      setActiveTaskId(null);
    }
  };

  const handleStatusChange = async (taskId: string, status: Task["status"]) => {
    setTaskError("");

    const token = getAuthToken();

    if (!token) {
      return;
    }

    setActiveTaskId(taskId);

    try {
      const currentTask = tasks.find((task) => task._id === taskId);

      if (!currentTask) {
        throw new Error("Task not found.");
      }

      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: currentTask.title,
          description: currentTask.description,
          dueDate: currentTask.dueDate,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update status.");
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task._id === taskId ? data : task))
      );
    } catch (statusError) {
      const errorMessage =
        statusError instanceof Error ? statusError.message : "Could not update status.";
      setTaskError(errorMessage);
    } finally {
      setActiveTaskId(null);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === "all" ? true : task.status === statusFilter;
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0
        ? true
        : task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const recentTasks = tasks.slice(0, 3);

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
            {user ? (
              <span className="mt-4 inline-flex rounded-full bg-stone-200 px-4 py-2 text-sm font-medium capitalize text-slate-700">
                Role: {user.role}
              </span>
            ) : null}
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

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Task overview</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Search tasks and filter them by status.
                </p>
              </div>
              <span className="rounded-full bg-stone-200 px-4 py-2 text-sm font-medium text-slate-700">
                {filteredTasks.length} shown
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title or description"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)]"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | Task["status"])
                }
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--primary)]"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(135deg,#0f766e,#115e59)] p-6 text-white">
            <h2 className="text-2xl font-semibold">Recent tasks</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-50/90">
              Quick look at the latest tasks added to your workspace.
            </p>

            <div className="mt-6 space-y-3">
              {recentTasks.length === 0 ? (
                <div className="rounded-2xl bg-white/10 px-4 py-4 text-sm text-emerald-50/90">
                  No tasks created yet.
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div key={task._id} className="rounded-2xl bg-white/10 px-4 py-4">
                    <p className="font-semibold text-white">{task.title}</p>
                    <p className="mt-1 text-sm text-emerald-50/90">
                      {task.status.replace("-", " ")}
                    </p>
                  </div>
                ))
              )}
            </div>
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
                  Edit, update status, or delete tasks from here.
                </p>
              </div>
              <span className="rounded-full bg-stone-200 px-4 py-2 text-sm font-medium text-slate-700">
                {filteredTasks.length} items
              </span>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white px-6 py-10 text-center text-sm text-[var(--muted)]">
                No tasks match the current search or filter.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {filteredTasks.map((task) => {
                  const isEditing = editingTaskId === task._id;
                  const isTaskBusy = activeTaskId === task._id;

                  return (
                    <article
                      key={task._id}
                      className="rounded-[1.5rem] border border-[var(--border)] bg-white p-5"
                    >
                      {isEditing ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editingForm.title}
                            onChange={(event) =>
                              setEditingForm((current) => ({
                                ...current,
                                title: event.target.value,
                              }))
                            }
                            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
                            placeholder="Task title"
                          />
                          <textarea
                            value={editingForm.description}
                            onChange={(event) =>
                              setEditingForm((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
                            placeholder="Task description"
                          />
                          <input
                            type="date"
                            value={editingForm.dueDate}
                            onChange={(event) =>
                              setEditingForm((current) => ({
                                ...current,
                                dueDate: event.target.value,
                              }))
                            }
                            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)]"
                          />

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => handleUpdateTask(task._id)}
                              disabled={isTaskBusy}
                              className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isTaskBusy ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingTask}
                              className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-stone-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                {task.title}
                              </h3>
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
                            {user?.role === "admin" && task.createdBy ? (
                              <span className="rounded-full bg-stone-100 px-3 py-1">
                                Owner: {task.createdBy.name}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <select
                              value={task.status}
                              onChange={(event) =>
                                handleStatusChange(
                                  task._id,
                                  event.target.value as Task["status"]
                                )
                              }
                              disabled={isTaskBusy}
                              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>

                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => startEditingTask(task)}
                                disabled={isTaskBusy}
                                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task._id)}
                                disabled={isTaskBusy}
                                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {isTaskBusy ? "Working..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
