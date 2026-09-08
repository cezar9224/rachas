import { z } from "zod";

import { RACHA_FORMATS } from "../rachas/formats";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createMatchSchema = z
  .object({
    date: z.string().regex(datePattern, "Informe uma data válida."),
    startTime: z.string().regex(timePattern, "Informe o horário inicial."),
    endTime: z.string().regex(timePattern, "Informe o horário final."),
    venue: z.string().trim().min(2, "Informe o local.").max(120, "Use no máximo 120 caracteres."),
    maxPlayers: z.coerce.number().int().min(2, "Use pelo menos 2 jogadores.").max(200, "Use no máximo 200 jogadores."),
    teamCount: z.coerce.number().int().min(2, "Use pelo menos 2 times.").max(50, "Use no máximo 50 times."),
    format: z.enum(RACHA_FORMATS, { error: "Escolha um formato." }),
    outfieldPlayers: z.coerce.number().int().min(1, "Use pelo menos 1 jogador de linha.").max(200, "Use no máximo 200 jogadores de linha por time."),
    goalkeepersPerTeam: z.coerce.number().int().min(0).max(50, "Use no máximo 50 goleiros por time."),
  })
  .superRefine((data, context) => {
    const startsAt = parseFortalezaDateTime(data.date, data.startTime);
    const endsAt = parseFortalezaDateTime(data.date, data.endTime);

    if (!startsAt || !endsAt || endsAt <= startsAt) {
      context.addIssue({ code: "custom", message: "O horário final deve ser posterior ao inicial.", path: ["endTime"] });
    }
  });

export function parseFortalezaDateTime(date: string, time: string) {
  const value = new Date(`${date}T${time}:00-03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function getAttendanceStatus(confirmedCount: number, maxPlayers: number) {
  return confirmedCount < maxPlayers ? "CONFIRMED" : "WAITING_LIST";
}

export type MatchActionState =
  | {
      errors?: Partial<Record<keyof z.input<typeof createMatchSchema>, string[]>>;
      message?: string;
    }
  | undefined;

export type AttendanceActionState =
  | {
      message: string;
      status: "CONFIRMED" | "WAITING_LIST" | "CANCELLED";
    }
  | undefined;
