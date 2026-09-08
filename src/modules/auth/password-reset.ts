import "server-only";

import { createHash, randomBytes } from "node:crypto";

const RESET_TOKEN_TTL_MINUTES = 30;

export function createPasswordResetToken() {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
  };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidPasswordResetToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
