import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/server/db";

const MAX_TRANSACTION_ATTEMPTS = 3;

export async function runSerializable<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await db.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error: unknown) {
      const shouldRetry =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < MAX_TRANSACTION_ATTEMPTS;

      if (!shouldRetry) throw error;
    }
  }

  throw new Error("Transaction retry limit reached.");
}
