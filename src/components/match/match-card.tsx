import Link from "next/link";
import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";

import { AttendanceButton } from "./attendance-button";
import { DeleteMatchButton } from "./delete-match-button";

type MatchCardProps = {
  confirmedCount: number;
  currentStatus: "CONFIRMED" | "WAITING_LIST" | null;
  endsAt: Date;
  id: string;
  isAdmin: boolean;
  maxPlayers: number;
  rachaId: string;
  startsAt: Date;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  venue: string;
  waitingCount: number;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Fortaleza" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Fortaleza" });

export function MatchCard({ confirmedCount, currentStatus, endsAt, id, isAdmin, maxPlayers, rachaId, startsAt, status, venue, waitingCount }: MatchCardProps) {
  const isFinalized = status === "COMPLETED";
  const acceptsAttendance = status === "SCHEDULED" && startsAt > new Date();
  const title = isFinalized ? "Finalizado" : status === "IN_PROGRESS" ? "Em andamento" : "Próximo racha";

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-950/90 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs font-black uppercase ${isFinalized ? "text-neutral-400" : "text-lime-400"}`}>{title}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-black text-white"><UsersRound aria-hidden="true" size={17} /> {confirmedCount} / {maxPlayers}</span>
      </div>
      <div className="mt-5 space-y-2 text-sm text-neutral-300">
        <p className="flex items-center gap-2 capitalize"><CalendarDays aria-hidden="true" className="text-cyan-300" size={17} /> {dateFormatter.format(startsAt)}</p>
        <p className="flex items-center gap-2"><Clock3 aria-hidden="true" className="text-cyan-300" size={17} /> {timeFormatter.format(startsAt)} – {timeFormatter.format(endsAt)}</p>
        <p className="flex items-center gap-2"><MapPin aria-hidden="true" className="text-cyan-300" size={17} /> {venue}</p>
      </div>
      {!isFinalized && waitingCount ? <p className="mt-4 text-xs font-semibold text-yellow-300">{waitingCount} na lista de espera</p> : null}
      {acceptsAttendance ? <div className="mt-5"><AttendanceButton currentStatus={currentStatus} matchId={id} rachaId={rachaId} /></div> : null}
      <Link className="mt-4 block text-center text-sm font-bold text-neutral-400 hover:text-white" href={`/racha/${rachaId}/partidas/${id}`}>{isFinalized ? "Ver resultados" : "Ver lista de presença"}</Link>
      {isAdmin && acceptsAttendance ? <DeleteMatchButton matchId={id} rachaId={rachaId} /> : null}
    </section>
  );
}
