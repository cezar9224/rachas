import { z } from "zod";

const id = z.string().cuid("Identificador inválido.");
const score = z.coerce.number().int().min(0).max(99);

export const gameSchema = z.object({ homeTeamId: id, awayTeamId: id, homeScore: score, awayScore: score })
  .refine((data) => data.homeTeamId !== data.awayTeamId, { message: "Escolha times diferentes." });
export const gameScoreSchema = z.object({ gameId: id, homeScore: score, awayScore: score });
export const goalSchema = z.object({ gameId: id, teamId: id, scorerId: id, quantity: z.coerce.number().int().min(1).max(99) });
export const matchStatusSchema = z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED"]);
export const teamNameSchema = z.object({ teamId: id, name: z.string().trim().min(2).max(30) });
export const movePlayerSchema = z.object({ teamPlayerId: id, destinationTeamId: id });
