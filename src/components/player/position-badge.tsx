export function PositionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-6 items-center rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 text-xs font-bold text-cyan-300">
      {children}
    </span>
  );
}
