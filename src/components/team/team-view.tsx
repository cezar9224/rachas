"use client";

import { LayoutGrid, List, Shield, Star } from "lucide-react";
import { useState } from "react";

import { PlayerAvatar } from "@/components/player/player-avatar";
import { PositionBadge } from "@/components/player/position-badge";
import type { RachaFormatValue } from "@/modules/rachas/formats";
import { FootballField } from "./football-field";

export type TeamViewData = {
  averageRating: number;
  color: string;
  id: string;
  name: string;
  players: {
    coordX: number | null;
    coordY: number | null;
    id: string;
    name: string;
    photoUrl: string | null;
    position: string | null;
  }[];
};

export function TeamView({ format, teams }: { format: RachaFormatValue; teams: TeamViewData[] }) {
  const [mode, setMode] = useState<"field" | "list">("field");
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");

  if (!teams.length) return null;
  const averages = teams.map(({ averageRating }) => averageRating);
  const difference = Math.max(...averages) - Math.min(...averages);
  const selectedTeam = teams.find(({ id }) => id === selectedTeamId) ?? teams[0];

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-lime-400">Times sorteados</p>
          <h2 className="mt-1 text-2xl font-black text-white">Formação equilibrada</h2>
        </div>
        <span className="text-right text-xs font-bold text-neutral-400">Diferença<br /><strong className="text-white">{difference.toFixed(2)}</strong></span>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-lg border border-neutral-800 bg-neutral-950 p-1" aria-label="Modo de visualização">
        <button aria-pressed={mode === "field"} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-bold ${mode === "field" ? "bg-lime-400 text-neutral-950" : "text-neutral-400 hover:text-white"}`} onClick={() => setMode("field")} type="button">
          <LayoutGrid aria-hidden="true" size={17} /> Campo
        </button>
        <button aria-pressed={mode === "list"} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-bold ${mode === "list" ? "bg-lime-400 text-neutral-950" : "text-neutral-400 hover:text-white"}`} onClick={() => setMode("list")} type="button">
          <List aria-hidden="true" size={17} /> Lista
        </button>
      </div>

      {mode === "field" ? (
        <div>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {teams.map((team) => (
              <button
                aria-pressed={selectedTeam.id === team.id}
                className={`inline-flex min-h-10 flex-none items-center gap-2 rounded-md border px-3 text-sm font-bold ${selectedTeam.id === team.id ? "border-neutral-500 bg-neutral-800 text-white" : "border-neutral-800 bg-neutral-950 text-neutral-400"}`}
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                type="button"
              >
                <Shield aria-hidden="true" color={team.color} fill={team.color} size={16} /> {team.name}
                <span className="text-yellow-300">{team.averageRating.toFixed(2)}</span>
              </button>
            ))}
          </div>
          <FootballField color={selectedTeam.color} format={format} players={selectedTeam.players} teamName={selectedTeam.name} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <article className="rounded-lg border border-neutral-800 bg-neutral-950/90" key={team.id}>
              <header className="flex items-center justify-between gap-3 border-b border-neutral-800 p-4">
                <h3 className="inline-flex items-center gap-2 font-black text-white"><Shield aria-hidden="true" color={team.color} fill={team.color} size={19} /> {team.name}</h3>
                <span className="inline-flex items-center gap-1 text-sm font-black text-yellow-300"><Star aria-hidden="true" fill="currentColor" size={14} /> {team.averageRating.toFixed(2)}</span>
              </header>
              <ol className="px-4">
                {team.players.map((player) => (
                  <li className="flex min-h-16 items-center gap-3 border-b border-neutral-800 py-2 last:border-0" key={player.id}>
                    <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{player.name}</p>
                      {player.position ? <div className="mt-1"><PositionBadge>{player.position}</PositionBadge></div> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
