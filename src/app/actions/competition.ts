"use server";

import "server-only";
import { MatchStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { gameSchema, gameScoreSchema, goalSchema, matchStatusSchema, movePlayerSchema, teamNameSchema } from "@/modules/matches/competition-schemas";
import { calculateCurrentRating } from "@/modules/ratings/calculation";
import { uploadChampionImage } from "@/modules/players/image";
import { requireRachaAdmin } from "@/server/authorization";
import { db } from "@/server/db";

export type CompetitionState = { error?: string; message?: string } | undefined;

export async function saveGame(rachaId: string, matchId: string, _state: CompetitionState, formData: FormData): Promise<CompetitionState> {
  await requireRachaAdmin(rachaId);
  const parsed = gameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const teams = await db.team.count({ where: { rachaId, matchId, id: { in: [parsed.data.homeTeamId, parsed.data.awayTeamId] }, match: { status: { not: MatchStatus.COMPLETED } } } });
  if (teams !== 2) return { error: "Times inválidos para este racha." };
  const last = await db.matchGame.aggregate({ where: { rachaId, matchId }, _max: { sequence: true } });
  await db.matchGame.create({ data: { rachaId, matchId, sequence: (last._max.sequence ?? 0) + 1, ...parsed.data } });
  await db.match.updateMany({ where: { id: matchId, rachaId, status: MatchStatus.SCHEDULED }, data: { status: MatchStatus.IN_PROGRESS } });
  refresh(rachaId, matchId);
  return { message: "Jogo e placar registrados." };
}

export async function updateGameScore(rachaId: string, matchId: string, _state: CompetitionState, formData: FormData): Promise<CompetitionState> {
  await requireRachaAdmin(rachaId);
  const parsed = gameScoreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const goals = await db.matchGoal.groupBy({ by: ["teamId"], where: { rachaId, matchId, gameId: parsed.data.gameId }, _sum: { quantity: true } });
  const game = await db.matchGame.findUnique({ where: { rachaId_matchId_id: { rachaId, matchId, id: parsed.data.gameId } }, select: { homeTeamId: true, awayTeamId: true, match: { select: { status: true } } } });
  if (!game || game.match.status === MatchStatus.COMPLETED) return { error: "Esse placar não pode mais ser alterado." };
  const totals = new Map(goals.map((goal) => [goal.teamId, goal._sum.quantity ?? 0]));
  if ((totals.get(game.homeTeamId) ?? 0) > parsed.data.homeScore || (totals.get(game.awayTeamId) ?? 0) > parsed.data.awayScore) return { error: "O placar não pode ser menor que os gols já atribuídos." };
  await db.matchGame.update({ where: { id: parsed.data.gameId }, data: { homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore } });
  refresh(rachaId, matchId); return { message: "Placar corrigido." };
}

export async function saveGoal(rachaId: string, matchId: string, _state: CompetitionState, formData: FormData): Promise<CompetitionState> {
  await requireRachaAdmin(rachaId);
  const parsed = goalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const game = await db.matchGame.findUnique({ where: { rachaId_matchId_id: { rachaId, matchId, id: parsed.data.gameId } }, select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true, match: { select: { status: true } } } });
  if (!game || game.match.status === MatchStatus.COMPLETED || ![game.homeTeamId, game.awayTeamId].includes(parsed.data.teamId)) return { error: "Jogo ou time inválido." };
  const player = await db.teamPlayer.findFirst({ where: { rachaId, matchId, teamId: parsed.data.teamId, memberId: parsed.data.scorerId }, select: { id: true } });
  if (!player) return { error: "O jogador não pertence a esse time." };
  const otherGoals = await db.matchGoal.aggregate({ where: { gameId: parsed.data.gameId, teamId: parsed.data.teamId, scorerId: { not: parsed.data.scorerId } }, _sum: { quantity: true } });
  const teamScore = parsed.data.teamId === game.homeTeamId ? game.homeScore : game.awayScore;
  if ((otherGoals._sum.quantity ?? 0) + parsed.data.quantity > teamScore) return { error: "Os gols dos jogadores não podem superar o placar do time." };
  await db.matchGoal.upsert({
    where: { gameId_scorerId: { gameId: parsed.data.gameId, scorerId: parsed.data.scorerId } },
    update: { quantity: parsed.data.quantity, teamId: parsed.data.teamId },
    create: { rachaId, matchId, ...parsed.data },
  });
  refresh(rachaId, matchId);
  return { message: "Gols do jogador atualizados." };
}

export async function changeMatchStatus(rachaId: string, matchId: string, _state: CompetitionState, formData: FormData): Promise<CompetitionState> {
  await requireRachaAdmin(rachaId);
  const parsed = matchStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return { error: "Status inválido." };
  if (parsed.data === "COMPLETED") {
    const games = await db.matchGame.count({ where: { rachaId, matchId } });
    if (!games) return { error: "Registre pelo menos um jogo antes de concluir o racha." };
  }
  const result = await db.match.updateMany({ where: { id: matchId, rachaId }, data: { status: parsed.data as MatchStatus } });
  if (!result.count) return { error: "Racha não encontrado." };
  refresh(rachaId, matchId);
  return { message: "Situação do racha atualizada." };
}

export async function saveChampionPhoto(rachaId: string, matchId: string, _state: CompetitionState, formData: FormData): Promise<CompetitionState> {
  await requireRachaAdmin(rachaId);
  try {
    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      const completed = await db.match.count({ where: { id: matchId, rachaId, status: MatchStatus.COMPLETED } });
      if (!completed) return { error: "Conclua o racha antes de salvar a comemoração." };
      return { message: "Racha finalizado sem foto dos campeões." };
    }
    const championPhotoUrl = await uploadChampionImage(file, matchId);
    const result = await db.match.updateMany({ where: { id: matchId, rachaId, status: MatchStatus.COMPLETED }, data: { championPhotoUrl } });
    if (!result.count) return { error: "Conclua o racha antes de salvar a foto dos campeões." };
    refresh(rachaId, matchId);
    return { message: "Foto do time campeão salva." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Não foi possível salvar a foto." }; }
}

export async function renameTeam(rachaId: string, matchId: string, _state: CompetitionState, formData: FormData): Promise<CompetitionState> {
  await requireRachaAdmin(rachaId);
  const parsed = teamNameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    const result = await db.team.updateMany({ where: { id: parsed.data.teamId, rachaId, matchId, match: { status: { not: MatchStatus.COMPLETED }, games: { none: {} } } }, data: { name: parsed.data.name } });
    if (!result.count) return { error: "O time não pode mais ser renomeado." };
    refresh(rachaId, matchId); return { message: "Nome do time atualizado." };
  } catch { return { error: "Esse nome já está sendo usado." }; }
}

export async function moveTeamPlayer(rachaId: string, matchId: string, _state: CompetitionState, formData: FormData): Promise<CompetitionState> {
  await requireRachaAdmin(rachaId);
  const parsed = movePlayerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const result = await db.$transaction(async (tx) => {
    const destination = await tx.team.findFirst({ where: { id: parsed.data.destinationTeamId, rachaId, matchId, match: { status: { not: MatchStatus.COMPLETED }, games: { none: {} } } }, select: { id: true } });
    const player = await tx.teamPlayer.findFirst({ where: { id: parsed.data.teamPlayerId, rachaId, matchId }, select: { id: true, teamId: true } });
    if (!destination || !player || destination.id === player.teamId) return false;
    await tx.teamPlayer.update({ where: { id: player.id }, data: { teamId: destination.id } });
    for (const teamId of [player.teamId, destination.id]) {
      const members = await tx.teamPlayer.findMany({ where: { rachaId, matchId, teamId }, select: { member: { select: { initialRating: true, ratingsReceived: { select: { value: true } } } } } });
      const ratings = members.map(({ member }) => calculateCurrentRating(member.initialRating === null ? null : Number(member.initialRating), member.ratingsReceived.map(({ value }) => Number(value))) ?? 5);
      await tx.team.update({ where: { id: teamId }, data: { averageRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0 } });
    }
    return true;
  });
  if (!result) return { error: "Não foi possível mover o jogador. Faça isso antes de registrar jogos." };
  refresh(rachaId, matchId); return { message: "Jogador movido para o outro time." };
}

function refresh(rachaId: string, matchId: string) {
  revalidatePath(`/racha/${rachaId}`);
  revalidatePath(`/racha/${rachaId}/partidas/${matchId}`);
  revalidatePath(`/racha/${rachaId}/historico`);
}
