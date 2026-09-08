import { Star } from "lucide-react";

export function RatingBadge({ value }: { value: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-black text-yellow-300">
      <Star aria-hidden="true" fill="currentColor" size={14} />
      {value === null ? "—" : value.toFixed(1)}
    </span>
  );
}
