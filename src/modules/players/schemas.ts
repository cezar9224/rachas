import { z } from "zod";

export const playerProfileSchema = z.object({
  nickname: z.string().trim().min(2, "Informe um apelido.").max(30, "Use no máximo 30 caracteres."),
  primaryPositionId: z.string().min(1, "Escolha a posição principal."),
  secondaryPositionIds: z.array(z.string().min(1)).max(4, "Escolha no máximo 4 posições secundárias."),
});

export type PlayerProfileActionState =
  | {
      errors?: {
        nickname?: string[];
        primaryPositionId?: string[];
        secondaryPositionIds?: string[];
        photo?: string[];
      };
      message?: string;
    }
  | undefined;
