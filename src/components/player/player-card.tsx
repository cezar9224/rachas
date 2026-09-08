import { PlayerAvatar } from "./player-avatar";
import { PositionBadge } from "./position-badge";
import { RatingBadge } from "./rating-badge";

export type PlayerCardData = {
  id: string;
  name: string;
  nickname: string | null;
  photoUrl: string | null;
  position: string | null;
  rating: number | null;
};

export function PlayerCard({ player, position, rachaId }: { player: PlayerCardData; position: number; rachaId: string }) {
  const displayName = player.nickname || player.name;

  return (
    <li className="border-b border-neutral-800 last:border-b-0">
      <Link className="flex min-h-20 items-center gap-3 py-3" href={`/racha/${rachaId}/jogadores/${player.id}`}>
        <span className="w-6 flex-none text-center text-sm font-bold text-neutral-600">{position}</span>
        <PlayerAvatar name={displayName} photoUrl={player.photoUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-white">{displayName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {player.position ? <PositionBadge>{player.position}</PositionBadge> : <span className="text-xs text-neutral-500">Perfil incompleto</span>}
          </div>
        </div>
        <RatingBadge value={player.rating} />
        <ChevronRight aria-hidden="true" className="text-neutral-600" size={18} />
      </Link>
    </li>
  );
}
import Link from "next/link";
import { ChevronRight } from "lucide-react";
