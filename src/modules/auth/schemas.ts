import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Informe um e-mail válido."));

const password = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .refine((value) => /[A-Za-zÀ-ÿ]/.test(value), "Inclua pelo menos uma letra.")
  .refine((value) => /\d/.test(value), "Inclua pelo menos um número.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "A senha deve ter no máximo 72 bytes.",
  );

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80, "Use no máximo 80 caracteres."),
  email,
  password,
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha."),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Confirme sua nova senha."),
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type AuthField = "name" | "email" | "password";

export type AuthActionState =
  | {
      errors?: Partial<Record<AuthField, string[]>>;
      message?: string;
    }
  | undefined;

export type PasswordResetActionState =
  | {
      errors?: Partial<Record<"email" | "password" | "confirmPassword", string[]>>;
      message?: string;
      resetUrl?: string;
    }
  | undefined;
