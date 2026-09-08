import { ParticipantStatus, PrismaClient, RachaRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const outfieldPositions = ["Zagueiro", "Lateral Direito", "Lateral Esquerdo", "Volante", "Meia", "Ponta", "Atacante"] as const;

async function main() {
  const racha = await prisma.racha.findUnique({
    where: { inviteCode: "F11TST" },
    include: { positions: true },
  });
  if (!racha) throw new Error("Arena Fut11 não encontrada. Execute o seed principal primeiro.");

  const positionByName = new Map(racha.positions.map((position) => [position.name, position.id]));
  const passwordHash = await hash("Rachas@123", 12);

  for (let index = 0; index < 32; index += 1) {
    const number = index + 1;
    const isGoalkeeper = index >= 30;
    const positionName = isGoalkeeper ? "Goleiro" : outfieldPositions[index % outfieldPositions.length];
    const positionId = positionByName.get(positionName);
    if (!positionId) throw new Error(`Posição ${positionName} não encontrada.`);

    const email = `fut11extra${number}@rachas.app`;
    const name = isGoalkeeper ? `Goleiro Extra ${number - 29}` : `Jogador Extra ${number}`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash },
      create: { email, name, passwordHash },
    });
    await prisma.rachaMember.upsert({
      where: { rachaId_userId: { rachaId: racha.id, userId: user.id } },
      update: {},
      create: {
        rachaId: racha.id,
        userId: user.id,
        role: RachaRole.PLAYER,
        initialRating: 7 + ((index * 7) % 15) / 10,
        profile: { create: { nickname: name, primaryPositionId: positionId } },
      },
      select: { id: true },
    });

  }

  const members = await prisma.rachaMember.findMany({
    where: { rachaId: racha.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, profile: { select: { primaryPosition: { select: { category: true } } } } },
  });
  const outfield = members.filter((member) => member.profile?.primaryPosition?.category !== "GOALKEEPER");
  const goalkeepers = members.filter((member) => member.profile?.primaryPosition?.category === "GOALKEEPER");
  if (outfield.length < 30 || goalkeepers.length < 2) throw new Error("São necessários 30 jogadores de linha e 2 goleiros.");

  const testGroups = [
    [...outfield.slice(0, 30), ...goalkeepers.slice(0, 2)],
    [...outfield.slice(-30), ...goalkeepers.slice(-2)],
    [...outfield.filter((_, index) => index % 2 === 0).slice(0, 30), goalkeepers[0], goalkeepers.at(-1)!],
  ];

  for (const [index, group] of testGroups.entries()) {
    const venue = `Campo Olímpico - Teste ${index + 1}`;
    let match = await prisma.match.findFirst({
      where: { rachaId: racha.id, venue, status: "SCHEDULED", startsAt: { gt: new Date() } },
      select: { id: true },
    });
    if (!match) {
      const startsAt = futureDate(2 + index * 7);
      match = await prisma.match.create({
        data: {
          rachaId: racha.id,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 90 * 60 * 1000),
          venue,
          maxPlayers: 32,
          teamCount: 3,
          format: "FUT11",
          outfieldPlayers: 10,
          goalkeepersPerTeam: 1,
        },
        select: { id: true },
      });
    }
    for (const member of group) {
      await prisma.matchParticipant.upsert({
        where: { matchId_memberId: { matchId: match.id, memberId: member.id } },
        update: { status: ParticipantStatus.CONFIRMED, queueOrder: null },
        create: { rachaId: racha.id, matchId: match.id, memberId: member.id, status: ParticipantStatus.CONFIRMED },
      });
    }
  }

  console.info("32 membros extras preservados e 3 rodadas FUT11 preparadas com 32 confirmados cada.");
}

function futureDate(daysFromToday: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  date.setUTCHours(22, 30, 0, 0);
  return date;
}

main()
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
