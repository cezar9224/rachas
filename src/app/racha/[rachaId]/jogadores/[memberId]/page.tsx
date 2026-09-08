import Link from "next/link";
import { ChevronLeft, Star, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { PlayerAvatar } from "@/components/player/player-avatar";
import { PositionBadge } from "@/components/player/position-badge";
import { RatingBadge } from "@/components/player/rating-badge";
import { RatingForm } from "@/components/rating/rating-form";
import { calculateCurrentRating } from "@/modules/ratings/calculation";
import { isAdministrativeRole, requireRachaMember } from "@/server/authorization";
import { db } from "@/server/db";

export default async function PlayerDetailsPage({ params }: PageProps<"/racha/[rachaId]/jogadores/[memberId]">) {
  const { rachaId, memberId } = await params;
  const { membership } = await requireRachaMember(rachaId);
  const player = await db.rachaMember.findUnique({
    where: { rachaId_id: { rachaId, id: memberId } },
    select: {
      id: true,
      initialRating: true,
      user: { select: { name: true } },
      profile: {
        select: {
          nickname: true,
          photoUrl: true,
          primaryPosition: { select: { name: true } },
          secondaryPositions: { select: { position: { select: { name: true } } } },
        },
      },
      ratingsReceived: {
        select: { authorMemberId: true, value: true },
      },
    },
  });

  if (!player) notFound();

  const displayName = player.profile?.nickname || player.user.name;
  const ratings = player.ratingsReceived.map(({ value }) => Number(value));
  const currentRating = calculateCurrentRating(
    player.initialRating === null ? null : Number(player.initialRating),
    ratings,
  );
  const ownRating = player.ratingsReceived.find(({ authorMemberId }) => authorMemberId === membership.id);
  const isSelf = membership.id === player.id;

  return (
    <main className="app-background min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link className="mb-7 inline-flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-white" href={`/racha/${rachaId}/jogadores`}>
          <ChevronLeft aria-hidden="true" size={18} /> Voltar aos jogadores
        </Link>

        <section className="flex items-center gap-4 border-b border-neutral-800 pb-7">
          <PlayerAvatar name={displayName} photoUrl={player.profile?.photoUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-black text-white">{displayName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {player.profile?.primaryPosition ? <PositionBadge>{player.profile.primaryPosition.name}</PositionBadge> : null}
              <RatingBadge value={currentRating} />
            </div>
          </div>
        </section>

        {player.profile?.secondaryPositions.length ? (
          <section className="mt-6">
            <h2 className="text-xs font-black uppercase text-neutral-500">Outras posições</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {player.profile.secondaryPositions.map(({ position }) => <PositionBadge key={position.name}>{position.name}</PositionBadge>)}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-lg border border-neutral-800 bg-neutral-950/90 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-white">Avaliação do racha</h2>
              <p className="mt-1 text-sm text-neutral-400">Média de {ratings.length} {ratings.length === 1 ? "avaliação" : "avaliações"}</p>
            </div>
            <span className="text-yellow-300"><Star aria-hidden="true" fill="currentColor" size={22} /></span>
          </div>
          {isSelf ? (
            <p className="mt-4 rounded-md border border-neutral-800 px-4 py-3 text-sm text-neutral-400">Você não pode avaliar seu próprio perfil.</p>
          ) : (
            <RatingForm
              initialValue={ownRating ? Number(ownRating.value) : null}
              mode="peer"
              rachaId={rachaId}
              targetMemberId={memberId}
            />
          )}
        </section>

        {isAdministrativeRole(membership.role) ? (
          <section className="mt-5 rounded-lg border border-neutral-800 bg-neutral-950/90 p-5">
            <div className="flex items-center gap-2 text-cyan-300"><UsersRound aria-hidden="true" size={18} /><h2 className="font-black text-white">Nota inicial</h2></div>
            <p className="mt-2 text-sm text-neutral-400">Usada enquanto o jogador ainda não recebeu avaliações.</p>
            <RatingForm
              initialValue={player.initialRating === null ? null : Number(player.initialRating)}
              mode="initial"
              rachaId={rachaId}
              targetMemberId={memberId}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
