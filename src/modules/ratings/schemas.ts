import { z } from "zod";

const ratingValue = z.coerce
  .number({ error: "Informe uma nota válida." })
  .min(0, "A nota mínima é 0.")
  .max(10, "A nota máxima é 10.")
  .refine((value) => Number.isInteger(value * 2), "Use intervalos de 0,5 ponto.");

export const playerRatingSchema = z.object({ value: ratingValue });
export const initialRatingSchema = z.object({ value: ratingValue });

export type RatingActionState =
  | {
      error?: string;
      message?: string;
    }
  | undefined;
