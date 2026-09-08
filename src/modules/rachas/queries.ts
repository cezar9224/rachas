import "server-only";

import { db } from "@/server/db";

export async function listUserRachas(userId: string) {
  return db.rachaMember.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      racha: {
        select: {
          id: true,
          name: true,
          city: true,
          venue: true,
          format: true,
          _count: { select: { members: true } },
          matches: {
            where: { startsAt: { gte: new Date() } },
            orderBy: { startsAt: "asc" },
            take: 1,
            select: { startsAt: true },
          },
        },
      },
    },
  });
}
