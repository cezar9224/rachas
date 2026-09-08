import { z } from "zod";

import { RACHA_FORMATS } from "./formats";

const requiredText = (label: string, max: number) =>
  z.string().trim().min(2, `Informe ${label}.`).max(max, `Use no máximo ${max} caracteres.`);

export const createRachaSchema = z.object({
  name: requiredText("o nome do racha", 80),
  city: requiredText("a cidade", 80),
  venue: requiredText("o local", 120),
  description: z.string().trim().max(500, "Use no máximo 500 caracteres.").optional(),
  format: z.enum(RACHA_FORMATS, { error: "Escolha um formato." }),
  outfieldPlayers: z.coerce.number().int().min(1, "Use pelo menos 1 jogador de linha.").max(200, "Use no máximo 200 jogadores de linha por time."),
  goalkeepersPerTeam: z.coerce.number().int().min(0, "A quantidade não pode ser negativa.").max(50, "Use no máximo 50 goleiros por time."),
  teamCount: z.coerce.number().int().min(2, "Use pelo menos 2 times.").max(50, "Use no máximo 50 times."),
});

export const joinRachaSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, "Informe um código de 6 caracteres."),
});

export type RachaFormField = keyof z.input<typeof createRachaSchema>;

export type RachaActionState =
  | {
      errors?: Partial<Record<RachaFormField, string[]>>;
      message?: string;
    }
  | undefined;

export type JoinRachaActionState =
  | {
      error?: string;
    }
  | undefined;
