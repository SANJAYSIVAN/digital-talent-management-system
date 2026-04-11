"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
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
  createdBy?:
    | string
    | {
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

const formatProfileDate = (value?: string | null) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return date.toLocaleDateString();
};

const toInputDateValue = (value: string | null) => {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().split("T")[0];
};

const isTaskOverdue = (task: Task) => {
  if (!task.dueDate || task.status === "completed") {
    return false;
  }

  return new Date(task.dueDate) < new Date();
};

const getTaskOwnerId = (task: Task) => {
  if (!task.createdBy) {
    return null;
  }

  return typeof task.createdBy === "string" ? task.createdBy : task.createdBy._id || null;
};

const getTaskOwnerName = (task: Task) => {
  if (!task.createdBy || typeof task.createdBy === "string") {
    return null;
  }

  return task.createdBy.name;
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
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, Task["status"]>>({});
  const statusUpdateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  useEffect(() => {
    const timers = statusUpdateTimers.current;

    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/");
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
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update status.");
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task._id === taskId ? data : task))
      );
      setPendingStatuses((current) => {
        const next = { ...current };
        delete next[taskId];
        return next;
      });
      if (statusUpdateTimers.current[taskId]) {
        clearTimeout(statusUpdateTimers.current[taskId]);
        delete statusUpdateTimers.current[taskId];
      }
    } catch (statusError) {
      const errorMessage =
        statusError instanceof Error ? statusError.message : "Could not update status.";
      setTaskError(errorMessage);
    } finally {
      setActiveTaskId(null);
    }
  };

  const handlePendingStatusChange = (taskId: string, status: Task["status"]) => {
    setPendingStatuses((current) => ({
      ...current,
      [taskId]: status,
    }));

    if (statusUpdateTimers.current[taskId]) {
      clearTimeout(statusUpdateTimers.current[taskId]);
    }

    statusUpdateTimers.current[taskId] = setTimeout(() => {
      handleStatusChange(taskId, status);
    }, 650);
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
  const isAdmin = user?.role === "admin";
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const pendingCount = tasks.filter((task) => task.status === "pending").length;
  const inProgressCount = tasks.filter((task) => task.status === "in-progress").length;
  const overdueCount = tasks.filter((task) => isTaskOverdue(task)).length;
  const completionRate =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  const ownedTaskCount = user
    ? tasks.filter((task) => {
        const ownerId = getTaskOwnerId(task);
        return ownerId === user._id || ownerId === user.id;
      }).length
    : 0;
  const hasTasks = tasks.length > 0;
  const skillCount = user?.skills?.length || 0;
  const profileCompletion = [
    user?.department,
    user?.designation,
    skillCount > 0 ? "skills" : "",
    user?.joinedDate,
  ].filter(Boolean).length;
  const profileCompletionRate = Math.round((profileCompletion / 4) * 100);

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
    <main className="relative min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_26%)]" />
      <section className="relative mx-auto grid w-full max-w-[1500px] gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="self-start w-full rounded-[2rem] border border-[rgba(255,255,255,0.18)] bg-[linear-gradient(180deg,#0f766e,#134e4a)] p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.14)] sm:p-7">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-50/70">
              Digital Talent Management
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">
              {isAdmin ? "Admin workspace" : "My workspace"}
            </h1>
          </div>

          <div className="mt-7 rounded-[1.75rem] bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/14 text-lg font-semibold text-white">
                {(user?.name || "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-white">
                  {user?.name || "Workspace user"}
                </p>
                <p className="truncate text-sm text-emerald-50/85">{user?.email}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/8 px-4 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">
                  Role
                </p>
                <p className="mt-1.5 text-sm font-semibold capitalize text-white">
                  {user?.role || "user"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">
                  Scope
                </p>
                <p className="mt-1.5 text-sm font-semibold text-white">
                  {isAdmin ? "All tasks" : "My tasks"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-50/65">
              Quick view
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-2.5">
                <span className="text-sm text-emerald-50/85">Tasks</span>
                <span className="text-sm font-semibold text-white">{tasks.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-2.5">
                <span className="text-sm text-emerald-50/85">Completed</span>
                <span className="text-sm font-semibold text-white">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-2.5">
                <span className="text-sm text-emerald-50/85">Active</span>
                <span className="text-sm font-semibold text-white">
                  {pendingCount + inProgressCount}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-2.5">
                <span className="text-sm text-emerald-50/85">Profile</span>
                <span className="text-sm font-semibold text-white">{profileCompletionRate}%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-50/65">
              Talent profile
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white/8 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">
                  Department
                </p>
                <p className="mt-2 truncate text-sm font-semibold text-white">
                  {user?.department || "Not set"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">
                  Designation
                </p>
                <p className="mt-2 truncate text-sm font-semibold text-white">
                  {user?.designation || "Not set"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">
                  Skills
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{skillCount}</p>
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">
                  Joined
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {formatProfileDate(user?.joinedDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <Link
              href="/profile"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/6 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[0_24px_90px_rgba(15,23,42,0.12)] sm:p-8 lg:p-9">
          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className={`${error ? "mt-6" : ""} flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between`}>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                Workspace Overview
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {user ? `${user.name}'s dashboard` : "Dashboard"}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                {isAdmin
                  ? "Monitor ownership, workload, and delivery progress across the workspace."
                  : "Track your workload, update task progress, and keep your profile current."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 2xl:w-full 2xl:max-w-[360px]">
              <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {isAdmin ? "Owned tasks" : "Your tasks"}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{ownedTaskCount}</p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Active work
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {pendingCount + inProgressCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Total Tasks
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{tasks.length}</p>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Pending
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{pendingCount}</p>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Completed
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{completedCount}</p>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Completion Rate
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{completionRate}%</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Performance snapshot
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">Analytics</h3>
                </div>
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                  {completionRate}% done
                </span>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#10b981)] transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    In Progress
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {inProgressCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Overdue
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{overdueCount}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Profile
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {profileCompletionRate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Profile snapshot
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                    {user?.designation || "Complete your profile"}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {user?.department || "Department not set"}
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-stone-100"
                >
                  Open profile
                </Link>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Department
                  </p>
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    {user?.department || "Not set"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Joined
                  </p>
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    {formatProfileDate(user?.joinedDate)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Skills
                  </p>
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    {skillCount > 0 ? `${skillCount} skills added` : "No skills added yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                {isAdmin ? "Create personal task" : "Create task"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {isAdmin
                  ? "Tasks created here will belong to your admin account."
                  : "Add a new task to your list."}
              </p>

              <form onSubmit={handleCreateTask} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-800">Title</label>
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

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-800">Description</label>
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

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-800">Due Date</label>
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
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
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

            <div className="space-y-6">
              <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Recent activity
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Recent tasks</h3>
                  </div>
                  <span className="inline-flex rounded-full bg-stone-200 px-4 py-2 text-sm font-medium text-slate-700">
                    {recentTasks.length} shown
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {recentTasks.length === 0 ? (
                    <div className="md:col-span-3 rounded-[1.25rem] border border-dashed border-[var(--border)] bg-white px-5 py-6 text-sm text-[var(--muted)]">
                      No recent tasks yet.
                    </div>
                  ) : (
                    recentTasks.map((task) => (
                      <div
                        key={task._id}
                        className="rounded-[1.25rem] border border-[var(--border)] bg-white p-4"
                      >
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="mt-2 text-sm capitalize text-slate-600">
                          {task.status.replace("-", " ")}
                        </p>
                        {isAdmin && getTaskOwnerName(task) ? (
                          <p className="mt-2 text-sm text-slate-500">
                            Owner: {getTaskOwnerName(task)}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Task list</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {isAdmin
                      ? "Admins can review all tasks, change any task status, and fully edit only their own tasks."
                      : "Edit, update status, or delete your tasks from here."}
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-stone-200 px-4 py-2 text-sm font-medium text-slate-700">
                  {filteredTasks.length} items
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
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
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--primary)]"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white px-6 py-10 text-center text-sm text-[var(--muted)]">
                  {hasTasks
                    ? "No tasks match the current search or filter."
                    : "No tasks yet. Create your first task to start building the workspace."}
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {filteredTasks.map((task) => {
                    const isEditing = editingTaskId === task._id;
                    const isTaskBusy = activeTaskId === task._id;
                    const isOwner =
                      !!user &&
                      (getTaskOwnerId(task) === user._id || getTaskOwnerId(task) === user.id);
                    const canEditTask = !isAdmin || isOwner;
                    const selectedStatus = pendingStatuses[task._id] ?? task.status;

                    return (
                      <article
                        key={task._id}
                        className="rounded-[1.5rem] border border-[var(--border)] bg-white p-5 sm:p-6"
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

                          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="rounded-full bg-stone-100 px-3 py-1">
                              Due: {formatTaskDate(task.dueDate)}
                            </span>
                            <span className="rounded-full bg-stone-100 px-3 py-1">
                              Created: {formatTaskDate(task.createdAt)}
                            </span>
                            {user?.role === "admin" && getTaskOwnerName(task) ? (
                              <span className="rounded-full bg-stone-100 px-3 py-1">
                                Owner: {getTaskOwnerName(task)}
                              </span>
                            ) : null}
                            {!canEditTask ? (
                              <span className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-slate-500">
                                Admin status-only
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,180px)_1fr] xl:items-center">
                            <select
                              value={selectedStatus}
                              onChange={(event) =>
                                handlePendingStatusChange(
                                  task._id,
                                  event.target.value as Task["status"]
                                )
                              }
                              disabled={isTaskBusy}
                              className="w-full rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>

                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                              {canEditTask ? (
                                <button
                                  type="button"
                                  onClick={() => startEditingTask(task)}
                                  disabled={isTaskBusy}
                                  className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                                >
                                  Edit
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task._id)}
                                disabled={isTaskBusy}
                                className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
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
          </div>
        </div>
      </section>
    </main>
  );
}
