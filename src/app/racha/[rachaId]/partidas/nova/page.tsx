import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { CreateMatchForm } from "@/components/match/create-match-form";
import { MAX_ACTIVE_MATCHES_PER_RACHA } from "@/modules/matches/limits";
import type { RachaFormatValue } from "@/modules/rachas/formats";
import { requireRachaAdmin } from "@/server/authorization";
import { db } from "@/server/db";

export default async function NewMatchPage({ params }: PageProps<"/racha/[rachaId]/partidas/nova">) {
  const { rachaId } = await params;
  await requireRachaAdmin(rachaId);
  const racha = await db.racha.findUniqueOrThrow({
    where: { id: rachaId },
    select: {
      name: true,
      venue: true,
      format: true,
      outfieldPlayers: true,
      goalkeepersPerTeam: true,
      defaultTeamCount: true,
      matches: { where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } }, select: { id: true }, take: MAX_ACTIVE_MATCHES_PER_RACHA },
    },
  });

  return (
    <main className="app-background min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link className="mb-7 inline-flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-white" href={`/racha/${rachaId}`}>
          <ChevronLeft aria-hidden="true" size={18} /> Voltar
        </Link>
        <div className="mb-8">
          <p className="text-sm font-bold uppercase text-lime-400">{racha.name}</p>
          <h1 className="mt-2 text-3xl font-black text-white">Nova partida</h1>
        </div>
        {racha.matches.length < MAX_ACTIVE_MATCHES_PER_RACHA ? <CreateMatchForm
          defaults={{
            format: racha.format as RachaFormatValue,
            goalkeepersPerTeam: racha.goalkeepersPerTeam,
            outfieldPlayers: racha.outfieldPlayers,
            teamCount: racha.defaultTeamCount,
            venue: racha.venue,
          }}
          rachaId={rachaId}
        /> : <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-5 py-6">
          <h2 className="font-black text-white">Limite de partidas atingido</h2>
          <p className="mt-2 text-sm text-neutral-300">Este racha já possui 2 partidas ativas. Conclua ou cancele uma delas antes de definir outra.</p>
          <Link className="secondary-button mt-5 w-full" href={`/racha/${rachaId}`}>Voltar para o racha</Link>
        </div>}
      </div>
    </main>
  );
}
