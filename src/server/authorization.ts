import "server-only";

import { RachaRole } from "@prisma/client";
import { notFound } from "next/navigation";

import { requireUser } from "@/server/auth";
import { db } from "@/server/db";

export function isAdministrativeRole(role: RachaRole) {
  return role === RachaRole.OWNER || role === RachaRole.ADMIN;
}

export async function requireRachaMember(rachaId: string) {
  const user = await requireUser();
  const membership = await db.rachaMember.findUnique({
    where: { rachaId_userId: { rachaId, userId: user.id } },
    select: {
      id: true,
      role: true,
      rachaId: true,
      userId: true,
      profile: { select: { id: true } },
    },
  });

  if (!membership) {
    notFound();
  }

  return { user, membership };
}

export async function requireRachaAdmin(rachaId: string) {
  const context = await requireRachaMember(rachaId);

  if (!isAdministrativeRole(context.membership.role)) {
    notFound();
  }

  return context;
}

export async function requireRachaOwner(rachaId: string) {
  const context = await requireRachaMember(rachaId);

  if (context.membership.role !== RachaRole.OWNER) {
    notFound();
  }

  return context;
}
