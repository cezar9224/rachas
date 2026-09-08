export default function RachaLoading() {
  return (
    <main className="app-background min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl animate-pulse space-y-7">
        <div className="h-10 w-10 rounded-lg bg-neutral-800" />
        <div className="h-11 w-3/4 rounded bg-neutral-800" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div className="h-28 rounded-lg bg-neutral-900" key={index} />)}</div>
      </div>
    </main>
  );
}
