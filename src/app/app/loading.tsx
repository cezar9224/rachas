export default function DashboardLoading() {
  return (
    <main className="app-background min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl animate-pulse space-y-8">
        <div className="h-11 w-36 rounded-lg bg-neutral-800" />
        <div className="space-y-3"><div className="h-4 w-28 rounded bg-neutral-800" /><div className="h-9 w-56 rounded bg-neutral-800" /></div>
        <div className="h-36 rounded-lg border border-neutral-800 bg-neutral-950" />
      </div>
    </main>
  );
}
