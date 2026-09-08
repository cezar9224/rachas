"use server";

import "server-only";

import { ParticipantStatus, Prisma, RachaFormat } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  type AttendanceActionState,
  createMatchSchema,
  getAttendanceStatus,
  type MatchActionState,
  parseFortalezaDateTime,
} from "@/modules/matches/schemas";
import { MAX_ACTIVE_MATCHES_PER_RACHA } from "@/modules/matches/limits";
import { runSerializable } from "@/modules/matches/transaction";
import { requireRachaAdmin, requireRachaMember } from "@/server/authorization";
import { db } from "@/server/db";

export async function createMatch(
  rachaId: string,
  _previousState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  await requireRachaAdmin(rachaId);
  const parsed = createMatchSchema.safeParse({
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    venue: formData.get("venue"),
    maxPlayers: formData.get("maxPlayers"),
    teamCount: formData.get("teamCount"),
    format: formData.get("format"),
    outfieldPlayers: formData.get("outfieldPlayers"),
    goalkeepersPerTeam: formData.get("goalkeepersPerTeam"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const startsAt = parseFortalezaDateTime(parsed.data.date, parsed.data.startTime);
  const endsAt = parseFortalezaDateTime(parsed.data.date, parsed.data.endTime);

  if (!startsAt || !endsAt || startsAt <= new Date()) {
    return { errors: { date: ["A partida deve acontecer no futuro."] } };
  }

  try {
    await runSerializable(async (transaction) => {
      const activeMatches = await transaction.match.count({
        where: { rachaId, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      });
      if (activeMatches >= MAX_ACTIVE_MATCHES_PER_RACHA) throw new Error("ACTIVE_MATCH_LIMIT_REACHED");

      await transaction.match.create({
        data: {
          rachaId,
          startsAt,
          endsAt,
          venue: parsed.data.venue,
          maxPlayers: parsed.data.maxPlayers,
          teamCount: parsed.data.teamCount,
          format: parsed.data.format as RachaFormat,
          outfieldPlayers: parsed.data.outfieldPlayers,
          goalkeepersPerTeam: parsed.data.goalkeepersPerTeam,
        },
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "ACTIVE_MATCH_LIMIT_REACHED") {
      return { message: "Este racha já possui 2 partidas ativas. Conclua ou cancele uma delas antes de definir outra." };
    }
    console.error("Falha ao criar partida", error);
    return { message: "Não foi possível criar a partida. Tente novamente." };
  }

  revalidatePath(`/racha/${rachaId}`);
  redirect(`/racha/${rachaId}`);
}

export async function confirmAttendance(
  rachaId: string,
  matchId: string,
  _previousState: AttendanceActionState,
  _formData: FormData,
): Promise<AttendanceActionState> {
  void _previousState;
  void _formData;
  const { membership } = await requireRachaMember(rachaId);

  try {
    const status = await runSerializable(async (transaction) => {
      const match = await transaction.match.findUnique({
        where: { rachaId_id: { rachaId, id: matchId } },
        select: { id: true, maxPlayers: true, startsAt: true },
      });

      if (!match || match.startsAt <= new Date()) {
        throw new Error("MATCH_UNAVAILABLE");
      }

      const existing = await transaction.matchParticipant.findUnique({
        where: { matchId_memberId: { matchId, memberId: membership.id } },
        select: { status: true },
      });

      if (existing) return existing.status;

      const confirmedCount = await transaction.matchParticipant.count({
        where: { rachaId, matchId, status: ParticipantStatus.CONFIRMED },
      });
      const nextStatus = getAttendanceStatus(confirmedCount, match.maxPlayers);
      const lastWaiting = nextStatus === "WAITING_LIST"
        ? await transaction.matchParticipant.aggregate({
            where: { rachaId, matchId, status: ParticipantStatus.WAITING_LIST },
            _max: { queueOrder: true },
          })
        : null;

      await transaction.matchParticipant.create({
        data: {
          rachaId,
          matchId,
          memberId: membership.id,
          status: nextStatus as ParticipantStatus,
          queueOrder: nextStatus === "WAITING_LIST" ? (lastWaiting?._max.queueOrder ?? 0) + 1 : null,
        },
      });
      await transaction.team.deleteMany({ where: { rachaId, matchId } });

      return nextStatus as ParticipantStatus;
    });

    revalidateMatchPaths(rachaId, matchId);
    return {
      status,
      message: status === ParticipantStatus.CONFIRMED ? "Presença confirmada." : "Você entrou na lista de espera.",
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "MATCH_UNAVAILABLE") {
      return { status: "CANCELLED", message: "Esta partida não está mais disponível." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "CANCELLED", message: "Sua presença já foi registrada. Atualize a página." };
    }

    console.error("Falha ao confirmar presença", error);
    return { status: "CANCELLED", message: "Não foi possível confirmar sua presença." };
  }
}

export async function cancelAttendance(
  rachaId: string,
  matchId: string,
  _previousState: AttendanceActionState,
  _formData: FormData,
): Promise<AttendanceActionState> {
  void _previousState;
  void _formData;
  const { membership } = await requireRachaMember(rachaId);

  try {
    const promoted = await runSerializable(async (transaction) => {
      const match = await transaction.match.findUnique({
        where: { rachaId_id: { rachaId, id: matchId } },
        select: { startsAt: true },
      });

      if (!match || match.startsAt <= new Date()) throw new Error("MATCH_UNAVAILABLE");

      const participant = await transaction.matchParticipant.findUnique({
        where: { matchId_memberId: { matchId, memberId: membership.id } },
        select: { id: true, status: true },
      });

      if (!participant) return false;

      await transaction.matchParticipant.delete({ where: { id: participant.id } });
      await transaction.team.deleteMany({ where: { rachaId, matchId } });

      if (participant.status !== ParticipantStatus.CONFIRMED) return false;

      const firstWaiting = await transaction.matchParticipant.findFirst({
        where: { rachaId, matchId, status: ParticipantStatus.WAITING_LIST },
        orderBy: [{ queueOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });

      if (!firstWaiting) return false;

      await transaction.matchParticipant.update({
        where: { id: firstWaiting.id },
        data: { status: ParticipantStatus.CONFIRMED, queueOrder: null },
      });
      return true;
    });

    revalidateMatchPaths(rachaId, matchId);
    return {
      status: "CANCELLED",
      message: promoted ? "Presença cancelada e primeira pessoa da espera promovida." : "Presença cancelada.",
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "MATCH_UNAVAILABLE") {
      return { status: "CANCELLED", message: "Esta partida não está mais disponível." };
    }

    console.error("Falha ao cancelar presença", error);
    return { status: "CANCELLED", message: "Não foi possível cancelar sua presença." };
  }
}

export async function deleteMatch(rachaId: string, matchId: string) {
  await requireRachaAdmin(rachaId);

  const result = await db.match.deleteMany({
    where: { id: matchId, rachaId },
  });

  if (result.count === 0) {
    redirect(`/racha/${rachaId}`);
  }

  revalidatePath(`/racha/${rachaId}`);
  revalidatePath("/app");
  redirect(`/racha/${rachaId}?partida=cancelada`);
}

function revalidateMatchPaths(rachaId: string, matchId: string) {
  revalidatePath(`/racha/${rachaId}`);
  revalidatePath(`/racha/${rachaId}/partidas/${matchId}`);
}
