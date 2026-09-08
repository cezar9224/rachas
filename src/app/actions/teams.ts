"use server";

import "server-only";

import { ParticipantStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { calculateCurrentRating } from "@/modules/ratings/calculation";
import type { RachaFormatValue } from "@/modules/rachas/formats";
import { assignFormationCoordinates } from "@/modules/teams/formation";
import { balanceTeams } from "@/modules/teams/team-balancer";
import { calculateTeamPlan } from "@/modules/teams/team-plan";
import { runSerializable } from "@/modules/matches/transaction";
import { requireRachaAdmin } from "@/server/authorization";

export type TeamActionState =
  | {
      error?: string;
      message?: string;
    }
  | undefined;

const TEAM_STYLES = [
  { color: "#38bdf8", name: "Time Azul" },
  { color: "#f87171", name: "Time Vermelho" },
  { color: "#4ade80", name: "Time Verde" },
  { color: "#facc15", name: "Time Amarelo" },
  { color: "#fb923c", name: "Time Laranja" },
  { color: "#c084fc", name: "Time Roxo" },
  { color: "#22d3ee", name: "Time Ciano" },
  { color: "#e5e7eb", name: "Time Branco" },
  { color: "#171717", name: "Time Preto" },
] as const;

export async function generateTeams(
  rachaId: string,
  matchId: string,
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  void _previousState;
  await requireRachaAdmin(rachaId);

  const selectedStyleIndexes = [...new Set(formData.getAll("teamStyle").map(Number))]
    .filter((index) => Number.isInteger(index) && index >= 0 && index < TEAM_STYLES.length);
  const selectedStyles = selectedStyleIndexes.map((index) => {
    const style = TEAM_STYLES[index];
    const customName = formData.get(`teamName_${index}`)?.toString().trim();
    return { ...style, name: customName || style.name };
  });
  if (selectedStyles.some(({ name }) => name.length < 2 || name.length > 30)) return { error: "Os nomes dos times devem ter entre 2 e 30 caracteres." };
  if (new Set(selectedStyles.map(({ name }) => name.toLocaleLowerCase("pt-BR"))).size !== selectedStyles.length) return { error: "Use nomes diferentes para cada time." };

  try {
    const result = await runSerializable(async (transaction) => {
      const match = await transaction.match.findUnique({
        where: { rachaId_id: { rachaId, id: matchId } },
        select: {
          startsAt: true,
          status: true,
          _count: { select: { games: true } },
          format: true,
          outfieldPlayers: true,
          goalkeepersPerTeam: true,
          participants: {
            where: { status: ParticipantStatus.CONFIRMED },
            select: {
              member: {
                select: {
                  id: true,
                  initialRating: true,
                  user: { select: { name: true } },
                  ratingsReceived: { select: { value: true } },
                  profile: {
                    select: {
                      nickname: true,
                      primaryPosition: { select: { id: true, category: true } },
                      secondaryPositions: { select: { position: { select: { category: true } } } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!match) throw new Error("MATCH_NOT_FOUND");
      if (match.startsAt <= new Date() || match.status !== "SCHEDULED" || match._count.games > 0) throw new Error("MATCH_ALREADY_STARTED");
      const players = match.participants.map(({ member }) => ({
        id: member.id,
        isGoalkeeper: member.profile?.primaryPosition?.category === "GOALKEEPER",
        name: member.profile?.nickname || member.user.name,
        primaryPosition: member.profile?.primaryPosition?.category ?? null,
        primaryPositionId: member.profile?.primaryPosition?.id ?? null,
        rating: calculateCurrentRating(
          member.initialRating === null ? null : Number(member.initialRating),
          member.ratingsReceived.map(({ value }) => Number(value)),
        ) ?? 5,
        secondaryPositions: member.profile?.secondaryPositions.map(({ position }) => position.category) ?? [],
      }));
      const goalkeeperCount = players.filter(({ isGoalkeeper }) => isGoalkeeper).length;
      const plan = calculateTeamPlan({
        goalkeeperCount,
        goalkeepersPerTeam: match.goalkeepersPerTeam,
        outfieldCount: players.length - goalkeeperCount,
        outfieldPlayersPerTeam: match.outfieldPlayers,
      });
      if (players.length < plan.teamCount) throw new Error("NOT_ENOUGH_PLAYERS");
      if (selectedStyles.length < plan.teamCount) throw new Error(`NOT_ENOUGH_STYLES:${plan.teamCount}`);
      const balance = balanceTeams({
        players,
        teamCount: plan.teamCount,
        playersPerTeam: plan.playersPerTeam,
        goalkeepersPerTeam: match.goalkeepersPerTeam,
        seed: hashSeed(`${rachaId}:${matchId}:${Date.now()}`),
      });

      await transaction.match.update({ where: { id: matchId }, data: { teamCount: plan.teamCount } });

      await transaction.team.deleteMany({ where: { rachaId, matchId } });
      for (const [index, team] of balance.teams.entries()) {
        const style = selectedStyles[index];
        const coordinates = new Map(
          assignFormationCoordinates(team.players, match.format as RachaFormatValue).map((coordinate) => [coordinate.id, coordinate]),
        );
        const createdTeam = await transaction.team.create({
          data: {
            rachaId,
            matchId,
            name: style.name,
            color: style.color,
            averageRating: team.averageRating,
            balanceScore: balance.balanceScore,
          },
          select: { id: true },
        });
        await transaction.teamPlayer.createMany({
          data: team.players.map((player) => ({
            coordX: coordinates.get(player.id)?.x ?? 50,
            coordY: coordinates.get(player.id)?.y ?? 50,
            rachaId,
            matchId,
            teamId: createdTeam.id,
            memberId: player.id,
            positionId: player.primaryPositionId,
          })),
        });
      }

      return { difference: balance.ratingDifference, missingGoalkeepers: plan.missingGoalkeepers, teamCount: plan.teamCount };
    });

    revalidatePath(`/racha/${rachaId}/partidas/${matchId}`);
    const goalkeeperWarning = result.missingGoalkeepers > 0
      ? ` Faltam ${result.missingGoalkeepers} ${result.missingGoalkeepers === 1 ? "goleiro" : "goleiros"} para completar todos os times.`
      : "";
    return { message: `${result.teamCount} times sorteados. Diferença entre médias: ${result.difference.toFixed(2)}.${goalkeeperWarning}` };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "MATCH_NOT_FOUND") return { error: "Partida não encontrada neste racha." };
    if (error instanceof Error && error.message === "NOT_ENOUGH_PLAYERS") return { error: "Confirme pelo menos um jogador por time antes do sorteio." };
    if (error instanceof Error && error.message.startsWith("NOT_ENOUGH_STYLES:")) {
      const teamCount = error.message.split(":")[1];
      return { error: `Selecione pelo menos ${teamCount} cores para formar os times.` };
    }
    if (error instanceof Error && error.message === "MATCH_ALREADY_STARTED") return { error: "O sorteio não pode ser alterado depois do início do racha." };
    console.error("Falha ao sortear times", error);
    return { error: "Não foi possível sortear os times. Tente novamente." };
  }
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
