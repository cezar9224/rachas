import { describe, expect, it } from "vitest";

import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "./schemas";

describe("signUpSchema", () => {
  it("normalizes a valid account payload", () => {
    const result = signUpSchema.parse({
      name: "  Ana Souza  ",
      email: "  ANA@EXAMPLE.COM ",
      password: "futebol123",
    });

    expect(result).toEqual({
      name: "Ana Souza",
      email: "ana@example.com",
      password: "futebol123",
    });
  });

  it("rejects weak passwords", () => {
    const result = signUpSchema.safeParse({
      name: "Ana Souza",
      email: "ana@example.com",
      password: "abcdefgh",
    });

    expect(result.success).toBe(false);
  });

  it("respects bcrypt's 72-byte password limit", () => {
    const result = signUpSchema.safeParse({
      name: "Ana Souza",
      email: "ana@example.com",
      password: `Senha1${"á".repeat(34)}`,
    });

    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("normalizes the email without applying sign-up password rules", () => {
    const result = signInSchema.parse({
      email: " ANDERSON@RACHAS.APP ",
      password: "x",
    });

    expect(result.email).toBe("anderson@rachas.app");
  });
});

describe("password reset schemas", () => {
  it("normalizes the recovery email", () => {
    expect(forgotPasswordSchema.parse({ email: " ANA@EXAMPLE.COM " }).email).toBe("ana@example.com");
  });

  it("requires matching strong passwords", () => {
    expect(resetPasswordSchema.safeParse({ password: "futebol123", confirmPassword: "outra123" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "futebol123", confirmPassword: "futebol123" }).success).toBe(true);
  });
});
