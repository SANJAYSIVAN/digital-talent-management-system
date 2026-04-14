import Link from "next/link";
import { StoredUser } from "@/lib/auth";

type DashboardSidebarProps = {
  user: StoredUser | null;
  isAdmin: boolean;
  tasksCount: number;
  completedCount: number;
  activeCount: number;
  profileCompletionRate: number;
  skillPreview: string[];
  joinedDateLabel: string;
  onLogout: () => void;
};

export default function DashboardSidebar({
  user,
  isAdmin,
  tasksCount,
  completedCount,
  activeCount,
  profileCompletionRate,
  skillPreview,
  joinedDateLabel,
  onLogout,
}: DashboardSidebarProps) {
  return (
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
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">Role</p>
            <p className="mt-1.5 text-sm font-semibold capitalize text-white">
              {user?.role || "user"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/8 px-4 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">Scope</p>
            <p className="mt-1.5 text-sm font-semibold text-white">
              {isAdmin ? "All tasks" : "My tasks"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-50/65">Quick view</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-2.5">
            <span className="text-sm text-emerald-50/85">Tasks</span>
            <span className="text-sm font-semibold text-white">{tasksCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-2.5">
            <span className="text-sm text-emerald-50/85">Completed</span>
            <span className="text-sm font-semibold text-white">{completedCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-2.5">
            <span className="text-sm text-emerald-50/85">Active</span>
            <span className="text-sm font-semibold text-white">{activeCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-2.5">
            <span className="text-sm text-emerald-50/85">Profile</span>
            <span className="text-sm font-semibold text-white">{profileCompletionRate}%</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-50/65">Talent profile</p>
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
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">Skills</p>
            {skillPreview.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {skillPreview.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-white">Not set</p>
            )}
          </div>
          <div className="rounded-2xl bg-white/8 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">Joined</p>
            <p className="mt-2 text-sm font-semibold text-white">{joinedDateLabel}</p>
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
          onClick={onLogout}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
