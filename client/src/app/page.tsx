import HomeAuthCard from "@/components/HomeAuthCard";

type HomePageProps = {
  searchParams?: Promise<{
    mode?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedMode = resolvedSearchParams?.mode;
  const initialMode = requestedMode === "login" ? "login" : "register";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#efe6d8] px-4 py-5 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(15,118,110,0.22),transparent_26%),radial-gradient(circle_at_85%_80%,rgba(245,158,11,0.15),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.5),transparent_55%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[42vh] bg-[linear-gradient(180deg,transparent,rgba(15,118,110,0.08))]" />

      <section className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1500px] flex-col rounded-[2rem] border border-white/50 bg-[rgba(255,251,245,0.76)] p-5 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Digital Talent Management System
          </h1>
        </header>

        <div className="mt-10 grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="max-w-2xl">
            <h2 className="mt-2 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Organize talent, tasks, and progress in one calm workspace.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">
              A cleaner space for employee profiles, work tracking, and role-based visibility.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HomeAuthCard initialMode={initialMode} />
          </div>
        </div>
      </section>
    </main>
  );
}
