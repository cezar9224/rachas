import Link from "next/link";
import { ChevronLeft, Clock3, MapPin, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { AttendanceButton } from "@/components/match/attendance-button";
import { CompetitionPanel } from "@/components/match/competition-panel";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { PositionBadge } from "@/components/player/position-badge";
import { RatingBadge } from "@/components/player/rating-badge";
import { DrawTeamsButton } from "@/components/team/draw-teams-button";
import { TeamView } from "@/components/team/team-view";
import { calculateCurrentRating } from "@/modules/ratings/calculation";
import type { RachaFormatValue } from "@/modules/rachas/formats";
import { assignFormationCoordinates } from "@/modules/teams/formation";
import { isAdministrativeRole, requireRachaMember } from "@/server/authorization";
import { db } from "@/server/db";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "America/Fortaleza" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Fortaleza" });

export default async function MatchPage({ params }: PageProps<"/racha/[rachaId]/partidas/[matchId]">) {
  const { rachaId, matchId } = await params;
  const { membership } = await requireRachaMember(rachaId);
  const match = await db.match.findUnique({
    where: { rachaId_id: { rachaId, id: matchId } },
    select: {
      startsAt: true,
      endsAt: true,
      venue: true,
      maxPlayers: true,
      status: true,
      championPhotoUrl: true,
      format: true,
      teams: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
          averageRating: true,
          players: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              memberId: true,
              coordX: true,
              coordY: true,
              member: {
                select: {
                  user: { select: { name: true } },
                  profile: { select: { nickname: true, photoUrl: true } },
                },
              },
              position: { select: { name: true, category: true } },
            },
          },
        },
      },
      games: { orderBy: { sequence: "asc" }, select: { id: true, sequence: true, homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true } },
      goals: { select: { gameId: true, teamId: true, scorerId: true, quantity: true, scorer: { select: { user: { select: { name: true } }, profile: { select: { nickname: true } } } } } },
      participants: {
        orderBy: [{ status: "asc" }, { queueOrder: "asc" }, { createdAt: "asc" }],
        select: {
          memberId: true,
          status: true,
          queueOrder: true,
          member: {
            select: {
              initialRating: true,
              ratingsReceived: { select: { value: true } },
              user: { select: { name: true } },
              profile: { select: { nickname: true, photoUrl: true, primaryPosition: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  if (!match) notFound();

  const participants = match.participants.map((participant) => ({
    ...participant,
    rating: calculateCurrentRating(
      participant.member.initialRating === null ? null : Number(participant.member.initialRating),
      participant.member.ratingsReceived.map(({ value }) => Number(value)),
    ),
  }));
  const confirmed = participants.filter(({ status }) => status === "CONFIRMED");
  const waiting = participants.filter(({ status }) => status === "WAITING_LIST");
  const currentStatus = match.participants.find(({ memberId }) => memberId === membership.id)?.status ?? null;
  const acceptsAttendance = match.status === "SCHEDULED" && match.startsAt > new Date();
  const teams = match.teams.map((team) => {
    const fallbackCoordinates = new Map(
      assignFormationCoordinates(
        team.players.map((player) => ({ id: player.id, primaryPosition: player.position?.category ?? null })),
        match.format as RachaFormatValue,
      ).map((coordinate) => [coordinate.id, coordinate]),
    );
    return {
      id: team.id,
      name: team.name,
      color: team.color,
      averageRating: Number(team.averageRating),
      players: team.players.map((player) => ({
        id: player.id,
        memberId: player.memberId,
        name: player.member.profile?.nickname || player.member.user.name,
        photoUrl: player.member.profile?.photoUrl ?? null,
        position: player.position?.name ?? null,
        coordX: player.coordX === null ? (fallbackCoordinates.get(player.id)?.x ?? 50) : Number(player.coordX),
        coordY: player.coordY === null ? (fallbackCoordinates.get(player.id)?.y ?? 50) : Number(player.coordY),
      })),
    };
  });

  return (
    <main className="app-background min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link className="mb-7 inline-flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-white" href={`/racha/${rachaId}`}>
          <ChevronLeft aria-hidden="true" size={18} /> Voltar
        </Link>
        <div className="mb-7">
          <p className="text-sm font-bold capitalize text-lime-400">{dateFormatter.format(match.startsAt)}</p>
          <h1 className="mt-2 text-3xl font-black text-white">Lista de presença</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-400">
            <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" size={16} /> {timeFormatter.format(match.startsAt)} – {timeFormatter.format(match.endsAt)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" size={16} /> {match.venue}</span>
          </div>
        </div>

        {acceptsAttendance ? <AttendanceButton currentStatus={currentStatus} matchId={matchId} rachaId={rachaId} /> : null}
        {acceptsAttendance && isAdministrativeRole(membership.role) ? <DrawTeamsButton hasTeams={teams.length > 0} matchId={matchId} rachaId={rachaId} /> : null}

        <ParticipantSection count={`${confirmed.length} / ${match.maxPlayers}`} participants={confirmed} title="Confirmados" />
        {waiting.length ? <ParticipantSection count={waiting.length.toString()} participants={waiting} title="Lista de espera" waiting /> : null}
        <TeamView format={match.format as RachaFormatValue} teams={teams} />
        <CompetitionPanel
          championPhotoUrl={match.championPhotoUrl}
          games={match.games}
          goals={match.goals.map((goal) => ({ ...goal, scorerName: goal.scorer.profile?.nickname || goal.scorer.user.name }))}
          isAdmin={isAdministrativeRole(membership.role)}
          matchId={matchId}
          rachaId={rachaId}
          status={match.status}
          teams={teams.map((team) => ({ id: team.id, name: team.name, players: team.players.map((player) => ({ id: player.id, memberId: player.memberId, name: player.name })) }))}
        />
      </div>
    </main>
  );
}

type Participant = {
  memberId: string;
  status: "CONFIRMED" | "WAITING_LIST";
  queueOrder: number | null;
  rating: number | null;
  member: {
    user: { name: string };
    profile: { nickname: string | null; photoUrl: string | null; primaryPosition: { name: string } | null } | null;
  };
};

function ParticipantSection({ count, participants, title, waiting = false }: { count: string; participants: Participant[]; title: string; waiting?: boolean }) {
  return (
    <section className="mt-9">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase text-neutral-300">{title}</h2>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-neutral-500"><UsersRound aria-hidden="true" size={16} /> {count}</span>
      </div>
      <ol className="rounded-lg border border-neutral-800 bg-neutral-950/90 px-4">
        {participants.map((participant, index) => {
          const name = participant.member.profile?.nickname || participant.member.user.name;
          return (
            <li className="flex min-h-18 items-center gap-3 border-b border-neutral-800 py-3 last:border-0" key={participant.memberId}>
              <span className="w-6 text-center text-sm font-bold text-neutral-600">{waiting ? participant.queueOrder : index + 1}</span>
              <PlayerAvatar name={name} photoUrl={participant.member.profile?.photoUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">{name}</p>
                {participant.member.profile?.primaryPosition ? <div className="mt-1"><PositionBadge>{participant.member.profile.primaryPosition.name}</PositionBadge></div> : null}
              </div>
              <RatingBadge value={participant.rating} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
