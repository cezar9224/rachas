import Link from "next/link";
import { BarChart3, CalendarDays, CalendarPlus, ChevronLeft, Clock3, MapPin, Shield, Shirt, Trophy, UserRound, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";

import { InviteCode } from "@/components/racha/invite-code";
import { MatchCard } from "@/components/match/match-card";
import { FORMAT_CONFIGS, type RachaFormatValue } from "@/modules/rachas/formats";
import { MAX_ACTIVE_MATCHES_PER_RACHA } from "@/modules/matches/limits";
import { isAdministrativeRole, requireRachaMember } from "@/server/authorization";
import { db } from "@/server/db";

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Fortaleza" });
const shortTimeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Fortaleza" });

export default async function RachaHomePage({ params, searchParams }: PageProps<"/racha/[rachaId]">) {
  const { rachaId } = await params;
  const query = await searchParams;
  const { membership } = await requireRachaMember(rachaId);

  if (!membership.profile) {
    redirect(`/racha/${rachaId}/perfil`);
  }
  const racha = await db.racha.findUniqueOrThrow({
    where: { id: membership.rachaId },
    select: {
      name: true,
      city: true,
      venue: true,
      description: true,
      inviteCode: true,
      format: true,
      outfieldPlayers: true,
      goalkeepersPerTeam: true,
      defaultTeamCount: true,
      _count: { select: { members: true } },
      matches: {
        where: { OR: [{ status: "IN_PROGRESS" }, { status: "COMPLETED" }, { status: "SCHEDULED", startsAt: { gte: new Date() } }] },
        orderBy: { startsAt: "desc" },
        take: 50,
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          venue: true,
          maxPlayers: true,
          status: true,
          participants: { select: { memberId: true, status: true } },
        },
      },
    },
  });
  const format = FORMAT_CONFIGS[racha.format as RachaFormatValue];
  const nextMatch = racha.matches.find(({ status }) => status === "IN_PROGRESS")
    ?? [...racha.matches].reverse().find(({ status }) => status === "SCHEDULED")
    ?? racha.matches.find(({ status }) => status === "COMPLETED")
    ?? null;
  const otherScheduledMatches = racha.matches
    .filter((match) => match.status === "SCHEDULED" && match.id !== nextMatch?.id)
    .sort((first, second) => first.startsAt.getTime() - second.startsAt.getTime());
  const currentParticipant = nextMatch?.participants.find(({ memberId }) => memberId === membership.id);
  const confirmedCount = nextMatch?.participants.filter(({ status }) => status === "CONFIRMED").length ?? 0;
  const waitingCount = nextMatch?.participants.filter(({ status }) => status === "WAITING_LIST").length ?? 0;
  const activeMatchCount = await db.match.count({
    where: { rachaId, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
  });

  return (
    <main className="app-background min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-center justify-between">
          <Link aria-label="Voltar aos meus rachas" className="icon-button border border-neutral-800 bg-neutral-950" href="/app" title="Voltar">
            <ChevronLeft aria-hidden="true" size={20} />
          </Link>
          <span className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-bold text-neutral-300">{format.label}</span>
        </header>

        <section className="mt-10">
          <span className="brand-mark"><Trophy aria-hidden="true" size={24} /></span>
          <h1 className="mt-5 text-3xl font-black text-white">{racha.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-neutral-400"><MapPin aria-hidden="true" size={17} /> {racha.venue}, {racha.city}</p>
          {racha.description ? <p className="mt-4 max-w-xl leading-7 text-neutral-300">{racha.description}</p> : null}
        </section>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<UsersRound aria-hidden="true" size={18} />} label="Jogadores" value={racha._count.members.toString()} />
          <Stat icon={<Shirt aria-hidden="true" size={19} />} label="Linha" value={racha.outfieldPlayers.toString()} />
          <Stat icon={<span aria-hidden="true" className="text-xl leading-none">🥅</span>} label="Goleiros" value={racha.goalkeepersPerTeam.toString()} />
          <Stat icon={<Shield aria-hidden="true" size={19} />} label="Times" value={racha.defaultTeamCount.toString()} />
        </section>

        {query.perfil === "salvo" ? (
          <p className="mt-6 rounded-lg border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm font-semibold text-lime-200">Perfil salvo com sucesso.</p>
        ) : null}

        {query.partida === "cancelada" ? (
          <p className="mt-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">Partida cancelada e removida com sucesso.</p>
        ) : null}

        <section className="mt-8">
          {nextMatch ? (
            <MatchCard
              confirmedCount={confirmedCount}
              currentStatus={currentParticipant?.status ?? null}
              endsAt={nextMatch.endsAt}
              id={nextMatch.id}
              isAdmin={isAdministrativeRole(membership.role)}
              maxPlayers={nextMatch.maxPlayers}
              rachaId={rachaId}
              startsAt={nextMatch.startsAt}
              status={nextMatch.status}
              venue={nextMatch.venue}
              waitingCount={waitingCount}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-700 px-5 py-9 text-center">
              <p className="font-bold text-white">Nenhuma partida agendada.</p>
              <p className="mt-2 text-sm text-neutral-400">A próxima partida aparecerá aqui.</p>
            </div>
          )}
          {isAdministrativeRole(membership.role) && activeMatchCount < MAX_ACTIVE_MATCHES_PER_RACHA ? (
            <Link className="primary-button mt-4 w-full sm:w-auto" href={`/racha/${rachaId}/partidas/nova`}>
              <CalendarPlus aria-hidden="true" size={19} /> Definir racha
            </Link>
          ) : isAdministrativeRole(membership.role) ? (
            <p className="mt-4 text-sm font-semibold text-neutral-500">Limite de 2 partidas ativas atingido.</p>
          ) : null}
        </section>

        {otherScheduledMatches.length ? (
          <section className="mt-8">
            <h2 className="text-sm font-black uppercase text-neutral-300">Outros rachas agendados</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {otherScheduledMatches.map((match) => (
                <Link className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 transition hover:border-lime-400/60" href={`/racha/${rachaId}/partidas/${match.id}`} key={match.id}>
                  <p className="flex items-center gap-2 font-black capitalize text-white"><CalendarDays className="text-lime-400" size={17} /> {shortDateFormatter.format(match.startsAt)}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-neutral-400"><Clock3 size={16} /> {shortTimeFormatter.format(match.startsAt)}</p>
                  <p className="mt-2 truncate text-sm text-neutral-500">{match.venue}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <nav className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link className="secondary-button" href={`/racha/${rachaId}/jogadores`}><UsersRound aria-hidden="true" size={18} /> Jogadores</Link>
          <Link className="secondary-button" href={`/racha/${rachaId}/historico`}><BarChart3 aria-hidden="true" size={18} /> Histórico</Link>
          <Link className="secondary-button" href={`/racha/${rachaId}/perfil`}><UserRound aria-hidden="true" size={18} /> Meu perfil</Link>
        </nav>

        {isAdministrativeRole(membership.role) ? (
          <section className="mt-8"><InviteCode code={racha.inviteCode} /></section>
        ) : null}
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/90 p-4">
      <span className="text-cyan-300">{icon}</span>
      <p className="mt-4 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-neutral-500">{label}</p>
    </div>
  );
}
