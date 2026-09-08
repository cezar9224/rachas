import { PlayerAvatar } from "@/components/player/player-avatar";
import { cn } from "@/lib/utils";
import { FORMAT_CONFIGS, type RachaFormatValue } from "@/modules/rachas/formats";

type FieldPlayer = {
  coordX: number | null;
  coordY: number | null;
  id: string;
  name: string;
  photoUrl: string | null;
  position: string | null;
};

const formatClasses: Record<RachaFormatValue, string> = {
  FUTSAL: "aspect-[2/3] bg-[#176050]",
  FUT7: "aspect-[3/4] bg-[#176b3a]",
  FUT11: "aspect-[2/3] bg-[#176b3a]",
  CUSTOM: "aspect-[3/4] bg-[#315f35]",
};

export function FootballField({ color, format, players, teamName }: { color: string; format: RachaFormatValue; players: FieldPlayer[]; teamName: string }) {
  return (
    <div
      aria-label={`Formação do ${teamName}`}
      className={cn("relative mx-auto w-full max-w-md overflow-hidden rounded-lg border-2 border-white/70 shadow-inner", formatClasses[format])}
      role="img"
      style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0, rgba(255,255,255,.025) 12.5%, rgba(0,0,0,.035) 12.5%, rgba(0,0,0,.035) 25%)" }}
    >
      <span className="absolute left-2 top-2 z-10 rounded bg-black/45 px-2 py-1 text-[10px] font-black uppercase text-white/80">{FORMAT_CONFIGS[format].label}</span>
      <div className="absolute inset-x-0 top-1/2 border-t-2 border-white/55" />
      <div className="absolute left-1/2 top-1/2 h-[18%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/55" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
      <div className="absolute left-[18%] right-[18%] top-[-1px] h-[15%] border-2 border-t-0 border-white/55" />
      <div className="absolute bottom-[-1px] left-[18%] right-[18%] h-[15%] border-2 border-b-0 border-white/55" />
      <div className="absolute left-[37%] right-[37%] top-[-1px] h-[5%] border-2 border-t-0 border-white/55" />
      <div className="absolute bottom-[-1px] left-[37%] right-[37%] h-[5%] border-2 border-b-0 border-white/55" />

      {players.map((player) => (
        <div
          className="absolute z-10 flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          key={player.id}
          style={{ left: `${player.coordX ?? 50}%`, top: `${player.coordY ?? 50}%` }}
        >
          <span className="flex overflow-hidden rounded-full border-2 leading-none shadow-lg" style={{ borderColor: color }}>
            <PlayerAvatar className="border-0" imageClassName="scale-125 object-[center_30%]" name={player.name} photoUrl={player.photoUrl} size="sm" />
          </span>
          <span className="mt-1 max-w-16 truncate rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-black text-white">{player.name}</span>
          {player.position ? <span className="mt-0.5 max-w-16 truncate text-[9px] font-bold text-white/80">{player.position}</span> : null}
        </div>
      ))}
    </div>
  );
}
