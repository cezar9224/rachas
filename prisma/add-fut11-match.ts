import { MatchStatus, ParticipantStatus, PrismaClient, RachaFormat } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const racha = await prisma.racha.findUnique({
    where: { inviteCode: "F11TST" },
    select: {
      id: true,
      venue: true,
      members: { orderBy: { createdAt: "asc" }, select: { id: true } },
      matches: { orderBy: { startsAt: "desc" }, take: 1, select: { startsAt: true } },
    },
  });
  if (!racha) throw new Error("Racha Fut11 não encontrado. Execute db:test-fut11-lista primeiro.");

  const activeMatches = await prisma.match.count({
    where: { rachaId: racha.id, status: { in: [MatchStatus.SCHEDULED, MatchStatus.IN_PROGRESS] } },
  });
  if (activeMatches >= 2) throw new Error("O Racha Fut11 já possui duas partidas ativas.");

  const minimumDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const afterLatest = racha.matches[0] ? new Date(racha.matches[0].startsAt.getTime() + 7 * 24 * 60 * 60 * 1000) : minimumDate;
  const startsAt = afterLatest > minimumDate ? afterLatest : minimumDate;
  startsAt.setUTCHours(22, 0, 0, 0);

  const match = await prisma.match.create({
    data: {
      rachaId: racha.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 90 * 60 * 1000),
      venue: racha.venue,
      maxPlayers: racha.members.length,
      teamCount: 3,
      format: RachaFormat.FUT11,
      outfieldPlayers: 10,
      goalkeepersPerTeam: 1,
      participants: {
        create: racha.members.map(({ id }) => ({ memberId: id, status: ParticipantStatus.CONFIRMED })),
      },
    },
    select: { id: true, startsAt: true, _count: { select: { participants: true } } },
  });

  console.info(`Nova partida Fut11 criada para ${match.startsAt.toISOString()} com ${match._count.participants} jogadores confirmados.`);
}

main()
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
