import { ParticipantStatus, PositionCategory, PrismaClient, RachaFormat, RachaRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const positions = [
  { name: "Goleiro", shortName: "GOL", category: PositionCategory.GOALKEEPER },
  { name: "Fixo", shortName: "FIX", category: PositionCategory.DEFENDER },
  { name: "Ala", shortName: "ALA", category: PositionCategory.MIDFIELDER },
  { name: "Pivô", shortName: "PIV", category: PositionCategory.ATTACKER },
] as const;

async function main() {
  await prisma.racha.deleteMany({ where: { inviteCode: "F11TST" } });
  await prisma.racha.deleteMany({ where: { inviteCode: "QD5TST" } });

  const passwordHash = await hash("Rachas@123", 12);
  const users = await Promise.all(Array.from({ length: 25 }, async (_, index) => {
    const number = index + 1;
    const isGoalkeeper = index >= 20;
    const name = index === 0 ? "Administrador Quadra" : isGoalkeeper ? `Goleiro Quadra ${number - 20}` : `Jogador Quadra ${number}`;
    const email = index === 0 ? "quadraadmin@rachas.app" : `quadrajogador${number}@rachas.app`;
    return prisma.user.upsert({ where: { email }, update: { name, passwordHash }, create: { name, email, passwordHash } });
  }));

  const racha = await prisma.racha.create({
    data: {
      name: "Racha da Quadra",
      city: "Fortaleza",
      venue: "Ginásio Central",
      description: "Cenário de Futsal com 5 times completos.",
      inviteCode: "QD5TST",
      format: RachaFormat.FUTSAL,
      outfieldPlayers: 4,
      goalkeepersPerTeam: 1,
      defaultTeamCount: 2,
      positions: { create: positions.map((position, index) => ({ ...position, sortOrder: index })) },
    },
    include: { positions: true },
  });
  const positionByName = new Map(racha.positions.map((position) => [position.name, position.id]));
  const members: { id: string }[] = [];
  const linePositions = ["Fixo", "Ala", "Pivô"] as const;

  for (let index = 0; index < users.length; index += 1) {
    const isGoalkeeper = index >= 20;
    const positionName = isGoalkeeper ? "Goleiro" : linePositions[index % linePositions.length];
    const positionId = positionByName.get(positionName);
    if (!positionId) throw new Error(`Posição ${positionName} não encontrada.`);
    members.push(await prisma.rachaMember.create({
      data: {
        rachaId: racha.id,
        userId: users[index].id,
        role: index === 0 ? RachaRole.OWNER : index === 1 ? RachaRole.ADMIN : RachaRole.PLAYER,
        initialRating: 7 + ((index * 7) % 16) / 10,
        profile: { create: { nickname: users[index].name, primaryPositionId: positionId } },
      },
      select: { id: true },
    }));
  }

  const startsAt = new Date();
  startsAt.setUTCDate(startsAt.getUTCDate() + 2);
  startsAt.setUTCHours(22, 0, 0, 0);
  await prisma.match.create({
    data: {
      rachaId: racha.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 90 * 60 * 1000),
      venue: racha.venue,
      maxPlayers: 25,
      teamCount: 5,
      format: RachaFormat.FUTSAL,
      outfieldPlayers: 4,
      goalkeepersPerTeam: 1,
      participants: { create: members.map((member) => ({ memberId: member.id, status: ParticipantStatus.CONFIRMED })) },
    },
  });

  console.info("Arena Fut11 removida e Racha da Quadra criado com 20 jogadores de linha e 5 goleiros.");
  console.info("Login: quadraadmin@rachas.app / Rachas@123");
}

main()
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
