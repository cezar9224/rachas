import { PrismaClient, RachaRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const testUsersFilter = { email: { endsWith: "@rachas.app" } } as const;
  const testOwnedRachas = await prisma.racha.findMany({
    where: {
      members: {
        some: {
          role: RachaRole.OWNER,
          user: testUsersFilter,
        },
      },
    },
    select: { id: true, name: true },
  });

  const result = await prisma.$transaction(async (transaction) => {
    const deletedRachas = await transaction.racha.deleteMany({
      where: { id: { in: testOwnedRachas.map(({ id }) => id) } },
    });
    const deletedUsers = await transaction.user.deleteMany({ where: testUsersFilter });
    return { deletedRachas: deletedRachas.count, deletedUsers: deletedUsers.count };
  });

  console.info(`${result.deletedUsers} usuários fictícios removidos.`);
  console.info(`${result.deletedRachas} rachas de teste removidos: ${testOwnedRachas.map(({ name }) => name).join(", ") || "nenhum"}.`);
}

main()
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
