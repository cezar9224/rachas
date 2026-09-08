"use server";

import "server-only";

import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import {
  type AuthActionState,
  forgotPasswordSchema,
  type PasswordResetActionState,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/modules/auth/schemas";
import { createPasswordResetToken, hashPasswordResetToken, isValidPasswordResetToken } from "@/modules/auth/password-reset";
import {
  clearSession,
  createSessionToken,
  setSessionCookie,
} from "@/modules/auth/session";
import { db } from "@/server/db";

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hash(password, 12);
  const session = createSessionToken();

  try {
    await db.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { name, email, passwordHash },
        select: { id: true },
      });

      await transaction.session.create({
        data: {
          userId: user.id,
          tokenHash: session.tokenHash,
          expiresAt: session.expiresAt,
        },
      });
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { email: ["Já existe uma conta com este e-mail."] } };
    }

    console.error("Falha ao criar conta", error);
    return { message: "Não foi possível criar sua conta. Tente novamente." };
  }

  await setSessionCookie(session.token, session.expiresAt);
  redirect("/app");
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true },
  });
  const passwordMatches = user
    ? await compare(parsed.data.password, user.passwordHash)
    : await hash(parsed.data.password, 12).then(() => false);

  if (!user || !passwordMatches) {
    return { message: "E-mail ou senha incorretos." };
  }

  const session = createSessionToken();

  try {
    await db.session.create({
      data: {
        userId: user.id,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error: unknown) {
    console.error("Falha ao iniciar sessão", error);
    return { message: "Não foi possível entrar. Tente novamente." };
  }

  await setSessionCookie(session.token, session.expiresAt);
  redirect("/app");
}

export async function signOut() {
  await clearSession();
  redirect("/");
}

export async function requestPasswordReset(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const genericMessage = "Se existir uma conta com este e-mail, as instruções de recuperação foram geradas.";
  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (!user) return { message: genericMessage };

  const reset = createPasswordResetToken();
  try {
    await db.$transaction([
      db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      db.passwordResetToken.create({
        data: { userId: user.id, tokenHash: reset.tokenHash, expiresAt: reset.expiresAt },
      }),
    ]);
  } catch (error: unknown) {
    console.error("Falha ao criar recuperação de senha", error);
    return { message: genericMessage };
  }

  return {
    message: genericMessage,
    resetUrl: process.env.NODE_ENV === "production" ? undefined : `/redefinir-senha/${reset.token}`,
  };
}

export async function resetPassword(
  token: string,
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  if (!isValidPasswordResetToken(token)) return { message: "Este link é inválido ou expirou." };

  const storedToken = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashPasswordResetToken(token) },
    select: { userId: true, expiresAt: true },
  });
  if (!storedToken || storedToken.expiresAt <= new Date()) return { message: "Este link é inválido ou expirou." };

  const passwordHash = await hash(parsed.data.password, 12);
  try {
    await db.$transaction(async (transaction) => {
      const consumed = await transaction.passwordResetToken.deleteMany({
        where: {
          tokenHash: hashPasswordResetToken(token),
          userId: storedToken.userId,
          expiresAt: { gt: new Date() },
        },
      });
      if (consumed.count !== 1) throw new Error("RESET_TOKEN_INVALID");

      await transaction.user.update({ where: { id: storedToken.userId }, data: { passwordHash } });
      await transaction.session.deleteMany({ where: { userId: storedToken.userId } });
      await transaction.passwordResetToken.deleteMany({ where: { userId: storedToken.userId } });
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "RESET_TOKEN_INVALID") return { message: "Este link é inválido ou expirou." };
    console.error("Falha ao redefinir senha", error);
    return { message: "Não foi possível redefinir a senha. Tente novamente." };
  }

  redirect("/entrar?senha=redefinida");
}
