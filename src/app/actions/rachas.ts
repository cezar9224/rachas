"use server";

import "server-only";

import { randomInt } from "node:crypto";

import { Prisma, RachaFormat, RachaRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { FORMAT_CONFIGS } from "@/modules/rachas/formats";
import { runSerializable } from "@/modules/matches/transaction";
import {
  createRachaSchema,
  type JoinRachaActionState,
  joinRachaSchema,
  type RachaActionState,
} from "@/modules/rachas/schemas";
import { requireUser } from "@/server/auth";
import { requireRachaOwner } from "@/server/authorization";
import { db } from "@/server/db";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_OWNED_RACHAS = 2;

function generateInviteCode() {
  return Array.from({ length: 6 }, () => INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)]).join("");
}

export async function createRacha(
  _previousState: RachaActionState,
  formData: FormData,
): Promise<RachaActionState> {
  const user = await requireUser();
  const parsed = createRachaSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city"),
    venue: formData.get("venue"),
    description: formData.get("description") || undefined,
    format: formData.get("format"),
    outfieldPlayers: formData.get("outfieldPlayers"),
    goalkeepersPerTeam: formData.get("goalkeepersPerTeam"),
    teamCount: formData.get("teamCount"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const config = FORMAT_CONFIGS[parsed.data.format];
  let createdRachaId: string | null = null;

  for (let attempt = 0; attempt < 5 && !createdRachaId; attempt += 1) {
    try {
      const racha = await runSerializable(async (transaction) => {
        const ownedRachas = await transaction.rachaMember.count({
          where: { userId: user.id, role: RachaRole.OWNER },
        });
        if (ownedRachas >= MAX_OWNED_RACHAS) throw new Error("RACHA_LIMIT_REACHED");

        return transaction.racha.create({
        data: {
          name: parsed.data.name,
          city: parsed.data.city,
          venue: parsed.data.venue,
          description: parsed.data.description || null,
          format: parsed.data.format as RachaFormat,
          outfieldPlayers: parsed.data.outfieldPlayers,
          goalkeepersPerTeam: parsed.data.goalkeepersPerTeam,
          defaultTeamCount: parsed.data.teamCount,
          inviteCode: generateInviteCode(),
          members: {
            create: { userId: user.id, role: RachaRole.OWNER },
          },
          positions: {
            create: config.positions.map((position, index) => ({
              ...position,
              sortOrder: index,
            })),
          },
        },
        select: { id: true },
        });
      });
      createdRachaId = racha.id;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "RACHA_LIMIT_REACHED") {
        return { message: "Você já criou 2 rachas. Exclua um deles antes de criar outro." };
      }
      const isInviteCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("inviteCode");

      if (!isInviteCollision) {
        console.error("Falha ao criar racha", error);
        return { message: "Não foi possível criar o racha. Tente novamente." };
      }
    }
  }

  if (!createdRachaId) {
    return { message: "Não foi possível gerar um código único. Tente novamente." };
  }

  revalidatePath("/app");
  redirect(`/racha/${createdRachaId}`);
}

export async function joinRacha(
  _previousState: JoinRachaActionState,
  formData: FormData,
): Promise<JoinRachaActionState> {
  const user = await requireUser();
  const parsed = joinRachaSchema.safeParse({ inviteCode: formData.get("inviteCode") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Código inválido." };
  }

  const racha = await db.racha.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
    select: { id: true },
  });

  if (!racha) {
    return { error: "Racha não encontrado. Confira o código." };
  }

  try {
    await db.rachaMember.create({
      data: { rachaId: racha.id, userId: user.id, role: RachaRole.PLAYER },
    });
  } catch (error: unknown) {
    const alreadyMember = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!alreadyMember) {
      console.error("Falha ao entrar no racha", error);
      return { error: "Não foi possível entrar no racha. Tente novamente." };
    }
  }

  revalidatePath("/app");
  redirect(`/racha/${racha.id}`);
}

export async function deleteRacha(rachaId: string) {
  await requireRachaOwner(rachaId);

  const result = await db.racha.deleteMany({ where: { id: rachaId } });
  if (result.count === 0) redirect("/app");

  revalidatePath("/app");
  redirect("/app?racha=excluido");
}
