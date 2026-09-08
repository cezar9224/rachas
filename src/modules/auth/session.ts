import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { db } from "@/server/db";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "rachas_session";
const DEFAULT_SESSION_TTL_DAYS = 30;

function getSessionTtlDays() {
  const configuredTtl = Number(process.env.SESSION_TTL_DAYS);
  return Number.isInteger(configuredTtl) && configuredTtl > 0
    ? configuredTtl
    : DEFAULT_SESSION_TTL_DAYS;
}

export function createSessionToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + getSessionTtlDays() * 24 * 60 * 60 * 1000);

  return { token, tokenHash, expiresAt };
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function clearSession() {
  const token = await getSessionToken();

  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
