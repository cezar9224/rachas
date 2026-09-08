import "server-only";

import { cache } from "react";

import { redirect } from "next/navigation";

import { getSessionToken, hashSessionToken } from "@/modules/auth/session";
import { db } from "@/server/db";

export const getCurrentUser = cache(async () => {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  const session = await db.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      expiresAt: { gt: new Date() },
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return session?.user ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  return user;
}
