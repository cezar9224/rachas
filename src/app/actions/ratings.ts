"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { initialRatingSchema, playerRatingSchema, type RatingActionState } from "@/modules/ratings/schemas";
import { requireRachaAdmin, requireRachaMember } from "@/server/authorization";
import { db } from "@/server/db";

export async function savePlayerRating(
  rachaId: string,
  targetMemberId: string,
  _previousState: RatingActionState,
  formData: FormData,
): Promise<RatingActionState> {
  const { membership } = await requireRachaMember(rachaId);
  const parsed = playerRatingSchema.safeParse({ value: formData.get("value") });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (membership.id === targetMemberId) return { error: "Você não pode avaliar a si próprio." };

  const target = await db.rachaMember.findUnique({
    where: { rachaId_id: { rachaId, id: targetMemberId } },
    select: { id: true },
  });

  if (!target) return { error: "Jogador não encontrado neste racha." };

  await db.playerRating.upsert({
    where: {
      rachaId_authorMemberId_targetMemberId: {
        rachaId,
        authorMemberId: membership.id,
        targetMemberId,
      },
    },
    update: { value: parsed.data.value },
    create: {
      rachaId,
      authorMemberId: membership.id,
      targetMemberId,
      value: parsed.data.value,
    },
  });

  revalidateRatingPaths(rachaId, targetMemberId);
  return { message: "Avaliação salva com sucesso." };
}

export async function saveInitialRating(
  rachaId: string,
  targetMemberId: string,
  _previousState: RatingActionState,
  formData: FormData,
): Promise<RatingActionState> {
  await requireRachaAdmin(rachaId);
  const parsed = initialRatingSchema.safeParse({ value: formData.get("value") });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const result = await db.rachaMember.updateMany({
    where: { id: targetMemberId, rachaId },
    data: { initialRating: parsed.data.value },
  });

  if (result.count === 0) return { error: "Jogador não encontrado neste racha." };

  revalidateRatingPaths(rachaId, targetMemberId);
  return { message: "Nota inicial atualizada." };
}

function revalidateRatingPaths(rachaId: string, targetMemberId: string) {
  revalidatePath(`/racha/${rachaId}/jogadores`);
  revalidatePath(`/racha/${rachaId}/jogadores/${targetMemberId}`);
  revalidatePath(`/racha/${rachaId}`);
}
