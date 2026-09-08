"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { uploadProfileImage } from "@/modules/players/image";
import {
  type PlayerProfileActionState,
  playerProfileSchema,
} from "@/modules/players/schemas";
import { requireRachaMember } from "@/server/authorization";
import { db } from "@/server/db";

export async function savePlayerProfile(
  rachaId: string,
  _previousState: PlayerProfileActionState,
  formData: FormData,
): Promise<PlayerProfileActionState> {
  const { membership } = await requireRachaMember(rachaId);
  const parsed = playerProfileSchema.safeParse({
    nickname: formData.get("nickname"),
    primaryPositionId: formData.get("primaryPositionId"),
    secondaryPositionIds: formData.getAll("secondaryPositionIds"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const secondaryPositionIds = [...new Set(parsed.data.secondaryPositionIds)].filter(
    (positionId) => positionId !== parsed.data.primaryPositionId,
  );
  const requestedPositionIds = [parsed.data.primaryPositionId, ...secondaryPositionIds];
  const validPositions = await db.position.count({
    where: { rachaId, id: { in: requestedPositionIds } },
  });

  if (validPositions !== requestedPositionIds.length) {
    return { message: "Uma das posições selecionadas não pertence a este racha." };
  }

  const photoEntry = formData.get("photo");
  let photoUrl: string | null = null;

  if (photoEntry instanceof File) {
    try {
      photoUrl = await uploadProfileImage(photoEntry, membership.id);
    } catch (error: unknown) {
      return {
        errors: {
          photo: [error instanceof Error ? error.message : "Não foi possível processar a foto."],
        },
      };
    }
  }

  try {
    await db.$transaction(async (transaction) => {
      const existingProfile = await transaction.playerProfile.findUnique({
        where: { memberId: membership.id },
        select: { id: true },
      });
      const profile = existingProfile
        ? await transaction.playerProfile.update({
            where: { id: existingProfile.id },
            data: {
              nickname: parsed.data.nickname,
              primaryPositionId: parsed.data.primaryPositionId,
              ...(photoUrl ? { photoUrl } : {}),
            },
            select: { id: true },
          })
        : await transaction.playerProfile.create({
            data: {
              rachaId,
              memberId: membership.id,
              nickname: parsed.data.nickname,
              primaryPositionId: parsed.data.primaryPositionId,
              photoUrl,
            },
            select: { id: true },
          });

      await transaction.playerSecondaryPosition.deleteMany({
        where: { rachaId, profileId: profile.id },
      });

      if (secondaryPositionIds.length) {
        await transaction.playerSecondaryPosition.createMany({
          data: secondaryPositionIds.map((positionId) => ({
            rachaId,
            profileId: profile.id,
            positionId,
          })),
        });
      }
    });
  } catch (error: unknown) {
    console.error("Falha ao salvar perfil", error);
    return { message: "Não foi possível salvar seu perfil. Tente novamente." };
  }

  revalidatePath(`/racha/${rachaId}`);
  revalidatePath(`/racha/${rachaId}/jogadores`);
  redirect(`/racha/${rachaId}?perfil=salvo`);
}
