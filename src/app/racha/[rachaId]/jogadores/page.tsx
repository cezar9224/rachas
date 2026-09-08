import Link from "next/link";
import { ChevronLeft, UsersRound } from "lucide-react";

import { PlayerList } from "@/components/player/player-list";
import { calculateCurrentRating } from "@/modules/ratings/calculation";
import { requireRachaMember } from "@/server/authorization";
import { db } from "@/server/db";

export default async function PlayersPage({ params }: PageProps<"/racha/[rachaId]/jogadores">) {
  const { rachaId } = await params;
  await requireRachaMember(rachaId);
  const racha = await db.racha.findUniqueOrThrow({
    where: { id: rachaId },
    select: {
      name: true,
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          initialRating: true,
          ratingsReceived: { select: { value: true } },
          user: { select: { name: true } },
          profile: {
            select: {
              nickname: true,
              photoUrl: true,
              primaryPosition: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  const players = racha.members.map((member) => ({
    id: member.id,
    name: member.user.name,
    nickname: member.profile?.nickname ?? null,
    photoUrl: member.profile?.photoUrl ?? null,
    position: member.profile?.primaryPosition?.name ?? null,
    rating: calculateCurrentRating(
      member.initialRating === null ? null : Number(member.initialRating),
      member.ratingsReceived.map(({ value }) => Number(value)),
    ),
  }));

  return (
    <main className="app-background min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link className="mb-7 inline-flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-white" href={`/racha/${rachaId}`}>
          <ChevronLeft aria-hidden="true" size={18} /> Voltar
        </Link>
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-lime-400">{racha.name}</p>
            <h1 className="mt-2 text-3xl font-black text-white">Jogadores</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-400"><UsersRound aria-hidden="true" size={17} /> {players.length}</span>
        </div>
        <PlayerList players={players} rachaId={rachaId} />
      </div>
    </main>
  );
}
