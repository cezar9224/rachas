import { ParticipantStatus, PositionCategory, PrismaClient, RachaFormat, RachaRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const positions = [
  { name: "Goleiro", shortName: "GOL", category: PositionCategory.GOALKEEPER },
  { name: "Zagueiro", shortName: "ZAG", category: PositionCategory.DEFENDER },
  { name: "Lateral", shortName: "LAT", category: PositionCategory.DEFENDER },
  { name: "Volante", shortName: "VOL", category: PositionCategory.MIDFIELDER },
  { name: "Meia", shortName: "MEI", category: PositionCategory.MIDFIELDER },
  { name: "Ponta", shortName: "PON", category: PositionCategory.ATTACKER },
  { name: "Atacante", shortName: "ATA", category: PositionCategory.ATTACKER },
] as const;

const players = [
  { name: "Elivardo", position: "Atacante" },
  { name: "Michel dos Cortes", position: "Zagueiro" },
  { name: "Berg", position: "Zagueiro" },
  { name: "JC", position: "Atacante" },
  { name: "Geovane", position: "Meia" },
  { name: "Dudu", position: "Meia" },
  { name: "Jr Alves", position: "Lateral" },
  { name: "Anderson", position: "Meia" },
  { name: "George", position: "Volante" },
  { name: "Paulo Lima", position: "Meia" },
  { name: "Filho", position: "Meia" },
  { name: "Ricardo", position: "Zagueiro" },
  { name: "Bruno Moura", position: "Lateral" },
  { name: "Mateus C", position: "Meia" },
  { name: "Fabio", position: "Zagueiro" },
  { name: "Léo", position: "Meia" },
  { name: "DS", position: "Ponta" },
  { name: "Jefim", position: "Volante" },
  { name: "Mbapper", position: "Atacante" },
  { name: "Boca", position: "Lateral" },
  { name: "Sergio", position: "Meia" },
  { name: "Marcos", position: "Volante" },
  { name: "Renildo", position: "Meia" },
  { name: "Gabriel", position: "Zagueiro" },
  { name: "Dema", position: "Volante" },
  { name: "Berg", position: "Atacante" },
  { name: "Tiago", position: "Atacante" },
  { name: "Pequeno", position: "Atacante" },
  { name: "Gustavo", position: "Volante" },
  { name: "Caçador", position: "Meia" },
  { name: "Goleiro Fut11 1", position: "Goleiro" },
  { name: "Goleiro Fut11 2", position: "Goleiro" },
] as const;

async function main() {
  await prisma.racha.deleteMany({ where: { inviteCode: "F11TST" } });

  const passwordHash = await hash("Rachas@123", 12);
  const users = await Promise.all(players.map((player, index) => {
    const email = index === 0 ? "fut11admin@rachas.app" : `fut11lista${index + 1}@rachas.app`;
    return prisma.user.upsert({
      where: { email },
      update: { name: player.name, passwordHash },
      create: { email, name: player.name, passwordHash },
    });
  }));

  const racha = await prisma.racha.create({
    data: {
      name: "Racha Fut11",
      city: "Fortaleza",
      venue: "Campo Olímpico",
      description: "Cenário Fut11 com a lista personalizada de jogadores.",
      inviteCode: "F11TST",
      format: RachaFormat.FUT11,
      outfieldPlayers: 10,
      goalkeepersPerTeam: 1,
      defaultTeamCount: 3,
      positions: { create: positions.map((position, index) => ({ ...position, sortOrder: index })) },
    },
    include: { positions: true },
  });

  const positionIds = new Map(racha.positions.map((position) => [position.name, position.id]));
  const members = [];
  for (const [index, player] of players.entries()) {
    const positionId = positionIds.get(player.position);
    if (!positionId) throw new Error(`Posição inválida para ${player.name}.`);
    members.push(await prisma.rachaMember.create({
      data: {
        rachaId: racha.id,
        userId: users[index].id,
        role: index === 0 ? RachaRole.OWNER : index === 1 ? RachaRole.ADMIN : RachaRole.PLAYER,
        initialRating: 7 + ((index * 7) % 16) / 10,
        profile: { create: { nickname: player.name, primaryPositionId: positionId } },
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
      maxPlayers: 32,
      teamCount: 3,
      format: RachaFormat.FUT11,
      outfieldPlayers: 10,
      goalkeepersPerTeam: 1,
      participants: { create: members.map(({ id }) => ({ memberId: id, status: ParticipantStatus.CONFIRMED })) },
    },
  });

  console.info("Racha Fut11 criado com 30 jogadores da lista, 2 goleiros e 32 presenças confirmadas.");
  console.info("Login: fut11admin@rachas.app / Rachas@123");
  console.info("Código: F11TST");
}

main()
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
