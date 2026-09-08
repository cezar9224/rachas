import { PlayerCard, type PlayerCardData } from "./player-card";

export function PlayerList({ players, rachaId }: { players: PlayerCardData[]; rachaId: string }) {
  if (!players.length) {
    return <p className="rounded-lg border border-dashed border-neutral-700 py-10 text-center text-sm text-neutral-400">Nenhum jogador encontrado.</p>;
  }

  return (
    <ol className="rounded-lg border border-neutral-800 bg-neutral-950/90 px-4">
      {players.map((player, index) => <PlayerCard key={player.id} player={player} position={index + 1} rachaId={rachaId} />)}
    </ol>
  );
}
