type RecentTask = {
  _id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
  ownerName?: string | null;
};

type RecentTasksPanelProps = {
  tasks: RecentTask[];
  showOwners: boolean;
};

export default function RecentTasksPanel({ tasks, showOwners }: RecentTasksPanelProps) {
  return (
    <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Recent activity
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Recent tasks</h3>
        </div>
        <span className="inline-flex rounded-full bg-stone-200 px-4 py-2 text-sm font-medium text-slate-700">
          {tasks.length} shown
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {tasks.length === 0 ? (
          <div className="md:col-span-3 rounded-[1.25rem] border border-dashed border-[var(--border)] bg-white px-5 py-6 text-sm text-[var(--muted)]">
            No recent tasks yet.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="rounded-[1.25rem] border border-[var(--border)] bg-white p-4"
            >
              <p className="font-semibold text-slate-900">{task.title}</p>
              <p className="mt-2 text-sm capitalize text-slate-600">
                {task.status.replace("-", " ")}
              </p>
              {showOwners && task.ownerName ? (
                <p className="mt-2 text-sm text-slate-500">Owner: {task.ownerName}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
