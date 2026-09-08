"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Camera, CheckCircle2, Medal, PartyPopper, Plus, Sparkles, Trophy } from "lucide-react";
import { changeMatchStatus, moveTeamPlayer, renameTeam, saveChampionPhoto, saveGame, saveGoal, updateGameScore } from "@/app/actions/competition";
import { calculateStandings } from "@/modules/matches/competition";

type Team = { id: string; name: string; players: { id: string; memberId: string; name: string }[] };
type Game = { id: string; sequence: number; homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number };
type Goal = { gameId: string; teamId: string; scorerId: string; quantity: number; scorerName: string };

export function CompetitionPanel({ championPhotoUrl, games, goals, isAdmin, matchId, rachaId, status, teams }: {
  championPhotoUrl: string | null; games: Game[]; goals: Goal[]; isAdmin: boolean; matchId: string; rachaId: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; teams: Team[];
}) {
  const standings = calculateStandings(teams, games);
  const scorers = [...goals.reduce((map, goal) => {
    const current = map.get(goal.scorerId);
    map.set(goal.scorerId, { ...goal, quantity: (current?.quantity ?? 0) + goal.quantity });
    return map;
  }, new Map<string, Goal>()).values()].sort((a, b) => b.quantity - a.quantity || a.scorerName.localeCompare(b.scorerName));
  const gameAction = saveGame.bind(null, rachaId, matchId);
  const statusAction = changeMatchStatus.bind(null, rachaId, matchId);
  const photoAction = saveChampionPhoto.bind(null, rachaId, matchId);
  const renameAction = renameTeam.bind(null, rachaId, matchId);
  const moveAction = moveTeamPlayer.bind(null, rachaId, matchId);
  const [gameState, submitGame, gamePending] = useActionState(gameAction, undefined);
  const [statusState, submitStatus, statusPending] = useActionState(statusAction, undefined);
  const [photoState, submitPhoto, photoPending] = useActionState(photoAction, undefined);
  const [renameState, submitRename, renamePending] = useActionState(renameAction, undefined);
  const [moveState, submitMove, movePending] = useActionState(moveAction, undefined);

  if (!teams.length) return null;
  return (
    <section className="mt-10 border-t border-neutral-800 pt-8">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase text-lime-400">Rodada</p><h2 className="mt-1 text-2xl font-black text-white">Jogos e classificação</h2></div>
        <span className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-bold text-neutral-300">{statusLabel(status)}</span>
      </div>

      {games.length ? <div className="mt-6 space-y-5">{games.map((game) => {
        const home = teams.find(({ id }) => id === game.homeTeamId)?.name;
        const away = teams.find(({ id }) => id === game.awayTeamId)?.name;
        const gameGoals = goals.filter((goal) => goal.gameId === game.id);
        const goalsComplete = isGoalEntryComplete(game, gameGoals);
        return <div className={`rounded-lg border p-5 text-sm shadow-lg shadow-black/20 ${goalsComplete ? "border-neutral-600 bg-neutral-900/80" : "border-neutral-800 bg-neutral-950"}`} key={game.id}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><span className="text-right font-bold text-white">{home}</span><strong className="text-lg text-lime-300">{game.homeScore} × {game.awayScore}</strong><span className="font-bold text-white">{away}</span></div>
          {isAdmin && status !== "COMPLETED" && !goalsComplete ? <GameScoreEditor game={game} matchId={matchId} rachaId={rachaId} /> : null}
          {game.homeScore + game.awayScore > 0 && (gameGoals.length > 0 || (isAdmin && status !== "COMPLETED")) ? <GoalEditor editable={isAdmin && status !== "COMPLETED"} game={game} goals={gameGoals} matchId={matchId} rachaId={rachaId} teams={teams} /> : null}
        </div>;
      })}</div> : <p className="mt-5 text-sm text-neutral-500">Nenhum jogo registrado nesta rodada.</p>}

      <div className="mt-8 rounded-lg border border-lime-400/30 bg-neutral-950/90 p-4 shadow-lg shadow-black/30">
        <h3 className="mb-3 text-lg font-black text-white">Classificação</h3>
        <div className="overflow-x-auto"><table className="w-full min-w-[460px] text-sm">
          <thead className="bg-lime-400/10 text-xs uppercase text-lime-300"><tr><th className="px-3 py-3 text-left"># Time</th><th>Pts</th><th>J</th><th>V</th><th>SG</th><th>GC</th><th>D</th></tr></thead>
          <tbody>{standings.map((row, index) => <tr className={`border-t border-neutral-800 text-center text-neutral-300 ${index === 0 ? "bg-lime-400/5" : ""}`} key={row.id}><td className="px-3 py-3.5 text-left font-bold text-white">{index + 1}. {row.name}</td><td className="text-base font-black text-lime-300">{row.points}</td><td>{row.played}</td><td>{row.won}</td><td>{row.goalDifference}</td><td>{row.goalsAgainst}</td><td>{row.lost}</td></tr>)}</tbody>
        </table></div>
      </div>

      {scorers.length ? <div className="mt-8 rounded-lg border border-yellow-300/30 bg-neutral-950/90 p-4 shadow-lg shadow-black/30"><h3 className="flex items-center gap-2 text-xl font-black text-white"><Medal className="text-yellow-300" size={23} /> Artilharia do dia</h3><ol className="mt-4 divide-y divide-neutral-800 overflow-hidden rounded-lg border border-neutral-800 bg-black/30">{scorers.map((goal, index) => <li className={`flex items-center justify-between gap-4 px-4 py-3.5 text-sm ${index === 0 ? "bg-yellow-300/10" : ""}`} key={`${goal.gameId}-${goal.scorerId}`}><span className="text-neutral-300"><strong className={index === 0 ? "text-yellow-300" : "text-neutral-500"}>{index + 1}.</strong> <strong className="text-white">{goal.scorerName}</strong></span><strong className="text-lime-300">{goal.quantity} {goal.quantity === 1 ? "gol" : "gols"}</strong></li>)}</ol></div> : null}

      {championPhotoUrl ? <div className="mt-7"><h3 className="mb-3 flex items-center gap-2 font-black text-white"><Trophy className="text-lime-400" size={18} /> Campeões do dia</h3><div className="relative aspect-video overflow-hidden rounded-lg border border-neutral-700"><Image alt="Time campeão da rodada" className="object-cover" fill sizes="672px" src={championPhotoUrl} unoptimized /></div></div> : null}

      {isAdmin ? <div className="mt-8 space-y-5 border-t border-neutral-800 pt-7">
        <h3 className="text-lg font-black text-white">Resultado do jogo</h3>
        {status !== "COMPLETED" ? <form action={submitGame} className="grid gap-3 rounded-lg border border-neutral-800 p-4 sm:grid-cols-2">
          <select className="form-control" name="homeTeamId" required><option value="">Time 1</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
          <select className="form-control" name="awayTeamId" required><option value="">Time 2</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
          <input className="form-control" min="0" name="homeScore" placeholder="Gols do time 1" required type="number" />
          <input className="form-control" min="0" name="awayScore" placeholder="Gols do time 2" required type="number" />
          <ActionMessage state={gameState} /><button className="primary-button sm:col-span-2" disabled={gamePending}><Plus size={18} /> Registrar jogo</button>
        </form> : null}

        <section className="mt-8 space-y-5 border-t border-neutral-800 pt-7">
          <div><p className="text-xs font-black uppercase text-cyan-300">Administração</p><h3 className="mt-1 text-lg font-black text-white">Controles e mudanças</h3></div>
          {!games.length && status !== "COMPLETED" ? <div className="grid gap-3 sm:grid-cols-2">
            <form action={submitRename} className="space-y-3 rounded-lg border border-neutral-800 p-4"><select className="form-control" name="teamId" required><option value="">Escolha o time</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><input className="form-control" maxLength={30} name="name" placeholder="Novo nome" required /><button className="secondary-button w-full" disabled={renamePending}>Renomear time</button><ActionMessage state={renameState} /></form>
            <form action={submitMove} className="space-y-3 rounded-lg border border-neutral-800 p-4"><select className="form-control" name="teamPlayerId" required><option value="">Escolha o jogador</option>{teams.flatMap((team) => team.players.map((player) => <option key={player.id} value={player.id}>{player.name} · {team.name}</option>))}</select><select className="form-control" name="destinationTeamId" required><option value="">Mover para</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><button className="secondary-button w-full" disabled={movePending}>Mover jogador</button><ActionMessage state={moveState} /></form>
          </div> : null}
          <form action={submitStatus} className="flex flex-col gap-3 sm:flex-row"><select className="form-control flex-1" defaultValue={status} name="status"><option value="SCHEDULED">Agendada</option><option value="IN_PROGRESS">Em andamento</option><option value="COMPLETED">Concluída</option></select><button className="secondary-button" disabled={statusPending}><CheckCircle2 size={18} /> Atualizar situação</button><ActionMessage state={statusState} /></form>
        </section>
        {status === "COMPLETED" ? <form action={submitPhoto} className="rounded-lg border border-lime-400/40 bg-neutral-950 p-5 shadow-lg shadow-black/30">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase text-lime-400"><PartyPopper size={17} /> Racha finalizado</p>
              <label className="mt-2 block text-2xl font-black text-white" htmlFor="champion-photo">Foto do time campeão</label>
            </div>
            <div className="flex items-center gap-2 text-yellow-300"><Sparkles size={20} /><Trophy size={34} /><Sparkles size={20} /></div>
          </div>
          <input accept="image/jpeg,image/png,image/webp" className="form-control" id="champion-photo" name="photo" type="file" />
          <p className="mt-2 text-xs text-neutral-500">Foto opcional · JPEG, PNG ou WebP, até 2 MB.</p>
          <button className="primary-button mt-4 w-full" disabled={photoPending}><Camera size={18} /> Salvar comemoração</button>
          <ActionMessage state={photoState} />
        </form> : <p className="rounded-lg border border-neutral-800 px-4 py-3 text-sm text-neutral-400">A foto dos campeões ficará disponível depois que o racha for concluído.</p>}
      </div> : null}
    </section>
  );
}

function ActionMessage({ state }: { state: { error?: string; message?: string } | undefined }) {
  if (!state?.error && !state?.message) return null;
  return <p className={`text-sm sm:col-span-2 ${state.error ? "text-red-300" : "text-lime-300"}`}>{state.error || state.message}</p>;
}
function statusLabel(status: string) { return ({ SCHEDULED: "Agendada", IN_PROGRESS: "Em andamento", COMPLETED: "Concluída", CANCELLED: "Cancelada" } as Record<string, string>)[status] ?? status; }

function GoalEditor({ editable, game, goals, matchId, rachaId, teams }: { editable: boolean; game: Game; goals: Goal[]; matchId: string; rachaId: string; teams: Team[] }) {
  const gameTeams = [game.homeTeamId, game.awayTeamId].map((teamId, index) => ({
    goals: goals.filter((goal) => goal.teamId === teamId),
    score: index === 0 ? game.homeScore : game.awayScore,
    team: teams.find(({ id }) => id === teamId),
  })).filter((item): item is { goals: Goal[]; score: number; team: Team } => Boolean(item.team));
  const complete = isGoalEntryComplete(game, goals);

  if (complete || !editable) return <GoalSummary teams={gameTeams} />;

  return <div className="mt-3 border-t border-neutral-800 pt-4">
    <h3 className="font-black text-white">Quem fez os gols?</h3>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {gameTeams.map(({ goals: teamGoals, score, team }) => teamGoals.reduce((total, goal) => total + goal.quantity, 0) === score
        ? <GoalSummary key={team.id} teams={[{ goals: teamGoals, score, team }]} />
        : <GoalTeamForm gameId={game.id} goals={teamGoals} key={team.id} matchId={matchId} rachaId={rachaId} team={team} />)}
    </div>
  </div>;
}

function GoalSummary({ teams }: { teams: { goals: Goal[]; score: number; team: Team }[] }) {
  const scoringTeams = teams.filter(({ goals }) => goals.length > 0);
  if (!scoringTeams.length) return null;
  return <div className="mt-3 grid gap-x-6 gap-y-2 border-t border-neutral-800 pt-3 sm:grid-cols-2">
    {scoringTeams.map(({ goals, team }) => <div className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-300" key={team.id}>
      <strong className="text-white">{team.name}:</strong>
      {goals.map((goal, index) => <span key={goal.scorerId}>{goal.scorerName} ({goal.quantity}){index < goals.length - 1 ? "," : ""}</span>)}
    </div>)}
  </div>;
}

function isGoalEntryComplete(game: Game, goals: Goal[]) {
  const totalFor = (teamId: string) => goals.filter((goal) => goal.teamId === teamId).reduce((total, goal) => total + goal.quantity, 0);
  return totalFor(game.homeTeamId) === game.homeScore && totalFor(game.awayTeamId) === game.awayScore;
}

function GoalTeamForm({ gameId, goals, matchId, rachaId, team }: { gameId: string; goals: Goal[]; matchId: string; rachaId: string; team: Team }) {
  const action = saveGoal.bind(null, rachaId, matchId);
  const [state, submit, pending] = useActionState(action, undefined);
  return <form action={submit} className="rounded-lg border border-neutral-800 bg-black/30 p-3">
    <input name="gameId" type="hidden" value={gameId} />
    <input name="teamId" type="hidden" value={team.id} />
    <p className="mb-3 font-bold text-neutral-200">{team.name}</p>
    <div className="grid gap-2 sm:grid-cols-[1fr_96px]">
      <select aria-label={`Jogador do ${team.name}`} className="form-control" name="scorerId" required>
        <option value="">Selecione o jogador</option>
        {team.players.map((player) => <option key={player.memberId} value={player.memberId}>{player.name}</option>)}
      </select>
      <input aria-label="Quantidade de gols" className="form-control" min="1" name="quantity" placeholder="Gols" required type="number" />
    </div>
    <button className="secondary-button mt-2 w-full" disabled={pending}>Salvar gols</button>
    {goals.length ? <ul className="mt-3 space-y-1 border-t border-neutral-800 pt-3 text-xs text-neutral-300">
      {goals.map((goal) => <li className="flex justify-between gap-3" key={goal.scorerId}><span>{goal.scorerName}</span><strong className="text-lime-300">{goal.quantity} {goal.quantity === 1 ? "gol" : "gols"}</strong></li>)}
    </ul> : null}
    <ActionMessage state={state} />
  </form>;
}

function GameScoreEditor({ game, matchId, rachaId }: { game: Game; matchId: string; rachaId: string }) {
  const action = updateGameScore.bind(null, rachaId, matchId);
  const [state, submit, pending] = useActionState(action, undefined);
  return <form action={submit} className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 border-t border-neutral-800 pt-3"><input name="gameId" type="hidden" value={game.id} /><input aria-label="Gols do time 1" className="form-control" defaultValue={game.homeScore} min="0" name="homeScore" type="number" /><input aria-label="Gols do time 2" className="form-control" defaultValue={game.awayScore} min="0" name="awayScore" type="number" /><button className="secondary-button" disabled={pending}>Salvar</button><ActionMessage state={state} /></form>;
}
