import Link from "next/link";
import { ArrowRight, MapPin, UsersRound } from "lucide-react";

import { FORMAT_CONFIGS, type RachaFormatValue } from "@/modules/rachas/formats";
import { DeleteRachaButton } from "./delete-racha-button";

type RachaCardProps = {
  canDelete: boolean;
  format: RachaFormatValue;
  id: string;
  memberCount: number;
  name: string;
  nextMatch: Date | null;
  venue: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function RachaCard({ canDelete, format, id, memberCount, name, nextMatch, venue }: RachaCardProps) {
  return (
    <article className="group flex items-start gap-4 rounded-lg border border-neutral-800 bg-neutral-950/90 p-5 hover:border-lime-400/50">
      <Link className="min-w-0 flex-1" href={`/racha/${id}`}>
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-lime-400">
            <span>{FORMAT_CONFIGS[format].label}</span>
            <span aria-hidden="true" className="text-neutral-700">•</span>
            <span className="inline-flex items-center gap-1 text-neutral-400">
              <UsersRound aria-hidden="true" size={14} /> {memberCount}
            </span>
          </div>
          <h3 className="truncate text-lg font-extrabold text-white">{name}</h3>
          <p className="mt-2 flex items-center gap-1.5 truncate text-sm text-neutral-400">
            <MapPin aria-hidden="true" size={15} /> {venue}
          </p>
          <p className="mt-3 text-sm font-semibold text-cyan-300">
            {nextMatch ? dateFormatter.format(nextMatch) : "Sem partida agendada"}
          </p>
        </div>
      </Link>
      <div className="flex flex-none flex-col gap-2">
        <Link aria-label={`Abrir ${name}`} className="icon-button border border-neutral-800 bg-neutral-900 group-hover:border-lime-400/40 group-hover:text-lime-400" href={`/racha/${id}`} title={`Abrir ${name}`}>
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
        {canDelete ? <DeleteRachaButton id={id} name={name} /> : null}
      </div>
    </article>
  );
}
