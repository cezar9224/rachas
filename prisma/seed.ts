import {
  ParticipantStatus,
  MatchStatus,
  PositionCategory,
  PrismaClient,
  RachaFormat,
  RachaRole,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const demoPlayers = [
  { name: "Anderson", nickname: "Anderson", position: "Meia", secondary: "Volante", rating: 8.0 },
  { name: "João Silva", nickname: "João", position: "Atacante", secondary: "Meia", rating: 8.4 },
  { name: "Carlos Santos", nickname: "Carlos", position: "Zagueiro", secondary: "Lateral", rating: 7.2 },
  { name: "Pedro Lima", nickname: "Pedro", position: "Volante", secondary: "Meia", rating: 7.7 },
  { name: "Lucas Rocha", nickname: "Lucas", position: "Atacante", secondary: "Meia", rating: 7.9 },
  { name: "Rafael Alves", nickname: "Rafael", position: "Goleiro", secondary: "Zagueiro", rating: 8.1 },
  { name: "Marcos Costa", nickname: "Marcos", position: "Zagueiro", secondary: "Volante", rating: 7.8 },
  { name: "Gabriel Souza", nickname: "Gabriel", position: "Meia", secondary: "Atacante", rating: 7.6 },
  { name: "Thiago Melo", nickname: "Thiago", position: "Lateral", secondary: "Volante", rating: 7.3 },
  { name: "José Oliveira", nickname: "José", position: "Goleiro", secondary: "Zagueiro", rating: 7.9 },
  { name: "Bruno Martins", nickname: "Bruno", position: "Volante", secondary: "Zagueiro", rating: 7.5 },
  { name: "Diego Ribeiro", nickname: "Diego", position: "Atacante", secondary: "Meia", rating: 8.2 },
  { name: "Felipe Gomes", nickname: "Felipe", position: "Lateral", secondary: "Zagueiro", rating: 7.4 },
  { name: "Gustavo Nunes", nickname: "Gustavo", position: "Meia", secondary: "Volante", rating: 8.3 },
  { name: "Henrique Dias", nickname: "Henrique", position: "Zagueiro", secondary: "Lateral", rating: 7.1 },
  { name: "Igor Freitas", nickname: "Igor", position: "Atacante", secondary: "Meia", rating: 7.8 },
  { name: "Alexandre Moura", nickname: "Alex", position: "Zagueiro", secondary: "Volante", rating: 7.4 },
  { name: "Breno Cardoso", nickname: "Breno", position: "Lateral", secondary: "Meia", rating: 7.6 },
  { name: "Caio Monteiro", nickname: "Caio", position: "Meia", secondary: "Atacante", rating: 8.0 },
  { name: "Daniel Castro", nickname: "Daniel", position: "Volante", secondary: "Zagueiro", rating: 7.3 },
  { name: "Eduardo Braga", nickname: "Dudu", position: "Atacante", secondary: "Meia", rating: 8.1 },
  { name: "Fabio Teixeira", nickname: "Fabio", position: "Zagueiro", secondary: "Lateral", rating: 7.5 },
  { name: "Heitor Barros", nickname: "Heitor", position: "Lateral", secondary: "Volante", rating: 7.7 },
  { name: "Jorge Matos", nickname: "Jorge", position: "Meia", secondary: "Volante", rating: 7.9 },
  { name: "Leandro Vieira", nickname: "Leandro", position: "Atacante", secondary: "Meia", rating: 8.2 },
  { name: "Matheus Correia", nickname: "Matheus", position: "Volante", secondary: "Lateral", rating: 7.2 },
  { name: "Nicolas Araujo", nickname: "Nicolas", position: "Zagueiro", secondary: "Volante", rating: 7.6 },
  { name: "Otavio Ramos", nickname: "Otavio", position: "Lateral", secondary: "Zagueiro", rating: 7.8 },
  { name: "Paulo Henrique", nickname: "Paulinho", position: "Meia", secondary: "Atacante", rating: 8.3 },
  { name: "Renato Freire", nickname: "Renato", position: "Atacante", secondary: "Meia", rating: 7.5 },
  { name: "Samuel Batista", nickname: "Samuel", position: "Volante", secondary: "Zagueiro", rating: 7.4 },
  { name: "Vinicius Lopes", nickname: "Vini", position: "Meia", secondary: "Lateral", rating: 8.0 },
] as const;

const fut7Positions = [
  { name: "Goleiro", shortName: "GOL", category: PositionCategory.GOALKEEPER },
  { name: "Zagueiro", shortName: "ZAG", category: PositionCategory.DEFENDER },
  { name: "Lateral", shortName: "LAT", category: PositionCategory.DEFENDER },
  { name: "Volante", shortName: "VOL", category: PositionCategory.MIDFIELDER },
  { name: "Meia", shortName: "MEI", category: PositionCategory.MIDFIELDER },
  { name: "Atacante", shortName: "ATA", category: PositionCategory.ATTACKER },
] as const;

const fut11Positions = [
  { name: "Goleiro", shortName: "GOL", category: PositionCategory.GOALKEEPER },
  { name: "Zagueiro", shortName: "ZAG", category: PositionCategory.DEFENDER },
  { name: "Lateral Direito", shortName: "LD", category: PositionCategory.DEFENDER },
  { name: "Lateral Esquerdo", shortName: "LE", category: PositionCategory.DEFENDER },
  { name: "Volante", shortName: "VOL", category: PositionCategory.MIDFIELDER },
  { name: "Meia", shortName: "MEI", category: PositionCategory.MIDFIELDER },
  { name: "Ponta", shortName: "PON", category: PositionCategory.ATTACKER },
  { name: "Atacante", shortName: "ATA", category: PositionCategory.ATTACKER },
] as const;

const fut11Names = [
  "Adriano", "Alan", "Alisson", "Andre", "Arthur", "Augusto", "Bernardo", "Cesar", "Cristian", "Davi",
  "Denis", "Douglas", "Emerson", "Enzo", "Erick", "Everton", "Fernando", "Francisco", "Gilberto", "Hugo",
  "Jean", "Juliano", "Kleber", "Leonardo", "Luiz", "Murilo", "Nathan", "Roberto", "Rodrigo", "Wesley",
  "Cassio", "Tadeu",
] as const;

const fut11OutfieldPositions = ["Zagueiro", "Lateral Direito", "Lateral Esquerdo", "Volante", "Meia", "Ponta", "Atacante"] as const;

function getNextTuesday(): Date {
  const date = new Date();
  const daysUntilTuesday = (2 - date.getUTCDay() + 7) % 7 || 7;

  date.setUTCDate(date.getUTCDate() + daysUntilTuesday);
  date.setUTCHours(22, 20, 0, 0); // 19:20 in America/Fortaleza.
  return date;
}

function getPreviousTuesday(): Date {
  const date = new Date();
  const daysSinceTuesday = (date.getUTCDay() - 2 + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() - daysSinceTuesday);
  date.setUTCHours(22, 20, 0, 0);
  return date;
}

async function main() {
  const passwordHash = await hash("Rachas@123", 12);

  await prisma.racha.deleteMany({ where: { inviteCode: { in: ["ARB7K2", "F11TST"] } } });

  const users = await Promise.all(
    demoPlayers.map((player, index) =>
      prisma.user.upsert({
        where: { email: index === 0 ? "anderson@rachas.app" : `jogador${index + 1}@rachas.app` },
        update: { name: player.name, passwordHash },
        create: {
          name: player.name,
          email: index === 0 ? "anderson@rachas.app" : `jogador${index + 1}@rachas.app`,
          passwordHash,
        },
      }),
    ),
  );

  const racha = await prisma.racha.create({
    data: {
      name: "Arena Rio Branco",
      city: "Fortaleza",
      venue: "Arena Rio Branco",
      description: "Racha de terça-feira às 19:20.",
      inviteCode: "ARB7K2",
      format: RachaFormat.FUT7,
      outfieldPlayers: 6,
      goalkeepersPerTeam: 1,
      defaultTeamCount: 2,
      positions: {
        create: fut7Positions.map((position, index) => ({
          ...position,
          sortOrder: index,
        })),
      },
    },
    include: { positions: true },
  });

  const positionByName = new Map(racha.positions.map((position) => [position.name, position]));
  const members: { id: string }[] = [];

  for (const [index, player] of demoPlayers.entries()) {
    const primaryPosition = positionByName.get(player.position);
    const secondaryPosition = positionByName.get(player.secondary);

    if (!primaryPosition || !secondaryPosition) {
      throw new Error(`Posição inválida no seed para ${player.name}.`);
    }

    const member = await prisma.rachaMember.create({
      data: {
        rachaId: racha.id,
        userId: users[index].id,
        role: index === 0 ? RachaRole.OWNER : index === 2 ? RachaRole.ADMIN : RachaRole.PLAYER,
        initialRating: player.rating,
        profile: {
          create: {
            nickname: player.nickname,
            primaryPositionId: primaryPosition.id,
            secondaryPositions: {
              create: {
                positionId: secondaryPosition.id,
              },
            },
          },
        },
      },
    });

    members.push(member);
  }

  await prisma.playerRating.createMany({
    data: members.flatMap((target, targetIndex) => [1, 2, 3].map((offset) => {
      const authorIndex = (targetIndex + offset) % members.length;
      return {
        rachaId: racha.id,
        authorMemberId: members[authorIndex].id,
        targetMemberId: target.id,
        value: Math.max(0, Math.min(10, demoPlayers[targetIndex].rating + (offset - 2) * 0.5)),
      };
    })),
  });

  const previousStartsAt = getPreviousTuesday();
  const previousMatch = await prisma.match.create({
    data: {
      rachaId: racha.id,
      startsAt: previousStartsAt,
      endsAt: new Date(previousStartsAt.getTime() + 90 * 60 * 1000),
      venue: racha.venue,
      maxPlayers: 14,
      teamCount: 2,
      format: RachaFormat.FUT7,
      outfieldPlayers: 6,
      goalkeepersPerTeam: 1,
      status: MatchStatus.COMPLETED,
      participants: { create: members.slice(0, 14).map((member) => ({ memberId: member.id, status: ParticipantStatus.CONFIRMED })) },
    },
  });

  const bluePlayers = [members[0], members[2], members[4], members[5], members[7], members[10], members[12]];
  const redPlayers = [members[1], members[3], members[6], members[8], members[9], members[11], members[13]];
  const [blueTeam, redTeam] = await Promise.all([
    prisma.team.create({ data: { rachaId: racha.id, matchId: previousMatch.id, name: "Time Azul", color: "#38bdf8", averageRating: 7.69, balanceScore: 0.04 } }),
    prisma.team.create({ data: { rachaId: racha.id, matchId: previousMatch.id, name: "Time Vermelho", color: "#f87171", averageRating: 7.73, balanceScore: 0.04 } }),
  ]);
  await prisma.teamPlayer.createMany({
    data: [
      ...bluePlayers.map((member) => ({ rachaId: racha.id, matchId: previousMatch.id, teamId: blueTeam.id, memberId: member.id })),
      ...redPlayers.map((member) => ({ rachaId: racha.id, matchId: previousMatch.id, teamId: redTeam.id, memberId: member.id })),
    ],
  });

  const games = await Promise.all([
    prisma.matchGame.create({ data: { rachaId: racha.id, matchId: previousMatch.id, homeTeamId: blueTeam.id, awayTeamId: redTeam.id, sequence: 1, homeScore: 2, awayScore: 1 } }),
    prisma.matchGame.create({ data: { rachaId: racha.id, matchId: previousMatch.id, homeTeamId: redTeam.id, awayTeamId: blueTeam.id, sequence: 2, homeScore: 3, awayScore: 3 } }),
    prisma.matchGame.create({ data: { rachaId: racha.id, matchId: previousMatch.id, homeTeamId: blueTeam.id, awayTeamId: redTeam.id, sequence: 3, homeScore: 1, awayScore: 2 } }),
  ]);
  await prisma.matchGoal.createMany({ data: [
    { rachaId: racha.id, matchId: previousMatch.id, gameId: games[0].id, teamId: blueTeam.id, scorerId: members[4].id, quantity: 2 },
    { rachaId: racha.id, matchId: previousMatch.id, gameId: games[0].id, teamId: redTeam.id, scorerId: members[1].id, quantity: 1 },
    { rachaId: racha.id, matchId: previousMatch.id, gameId: games[1].id, teamId: redTeam.id, scorerId: members[1].id, quantity: 2 },
    { rachaId: racha.id, matchId: previousMatch.id, gameId: games[1].id, teamId: redTeam.id, scorerId: members[11].id, quantity: 1 },
    { rachaId: racha.id, matchId: previousMatch.id, gameId: games[1].id, teamId: blueTeam.id, scorerId: members[0].id, quantity: 1 },
    { rachaId: racha.id, matchId: previousMatch.id, gameId: games[1].id, teamId: blueTeam.id, scorerId: members[4].id, quantity: 2 },
    { rachaId: racha.id, matchId: previousMatch.id, gameId: games[2].id, teamId: blueTeam.id, scorerId: members[7].id, quantity: 1 },
    { rachaId: racha.id, matchId: previousMatch.id, gameId: games[2].id, teamId: redTeam.id, scorerId: members[11].id, quantity: 2 },
  ] });

  const startsAt = getNextTuesday();
  const endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000);

  await prisma.match.create({
    data: {
      rachaId: racha.id,
      startsAt,
      endsAt,
      venue: racha.venue,
      maxPlayers: 32,
      teamCount: 2,
      format: RachaFormat.FUT7,
      outfieldPlayers: 6,
      goalkeepersPerTeam: 1,
      participants: {
        create: members.map((member) => ({
          memberId: member.id,
          status: ParticipantStatus.CONFIRMED,
          queueOrder: null,
        })),
      },
    },
  });

  const fut11Users = await Promise.all(fut11Names.map((name, index) => prisma.user.upsert({
    where: { email: index === 0 ? "fut11admin@rachas.app" : `fut11jogador${index + 1}@rachas.app` },
    update: { name, passwordHash },
    create: { name, email: index === 0 ? "fut11admin@rachas.app" : `fut11jogador${index + 1}@rachas.app`, passwordHash },
  })));
  const fut11Racha = await prisma.racha.create({
    data: {
      name: "Arena Fut11",
      city: "Fortaleza",
      venue: "Campo Olímpico",
      description: "Cenário de teste com 30 jogadores de linha e 2 goleiros.",
      inviteCode: "F11TST",
      format: RachaFormat.FUT11,
      outfieldPlayers: 10,
      goalkeepersPerTeam: 1,
      defaultTeamCount: 2,
      positions: { create: fut11Positions.map((position, index) => ({ ...position, sortOrder: index })) },
    },
    include: { positions: true },
  });
  const fut11PositionByName = new Map(fut11Racha.positions.map((position) => [position.name, position]));
  const fut11Members: { id: string }[] = [];
  for (const [index, name] of fut11Names.entries()) {
    const isGoalkeeper = index >= 30;
    const positionName = isGoalkeeper ? "Goleiro" : fut11OutfieldPositions[index % fut11OutfieldPositions.length];
    const primaryPosition = fut11PositionByName.get(positionName);
    if (!primaryPosition) throw new Error(`Posição FUT11 inválida para ${name}.`);
    fut11Members.push(await prisma.rachaMember.create({
      data: {
        rachaId: fut11Racha.id,
        userId: fut11Users[index].id,
        role: index === 0 ? RachaRole.OWNER : index === 1 ? RachaRole.ADMIN : RachaRole.PLAYER,
        initialRating: 7 + ((index * 3) % 14) / 10,
        profile: { create: { nickname: name, primaryPositionId: primaryPosition.id } },
      },
      select: { id: true },
    }));
  }
  await prisma.match.create({
    data: {
      rachaId: fut11Racha.id,
      startsAt: new Date(startsAt.getTime() + 24 * 60 * 60 * 1000),
      endsAt: new Date(endsAt.getTime() + 24 * 60 * 60 * 1000),
      venue: fut11Racha.venue,
      maxPlayers: 32,
      teamCount: 2,
      format: RachaFormat.FUT11,
      outfieldPlayers: 10,
      goalkeepersPerTeam: 1,
      participants: { create: fut11Members.map((member) => ({ memberId: member.id, status: ParticipantStatus.CONFIRMED })) },
    },
  });

  console.info("Seed concluído.");
  console.info("Login: anderson@rachas.app / Rachas@123");
  console.info(`Racha: ${racha.name} (${racha.inviteCode})`);
  console.info("Login FUT11: fut11admin@rachas.app / Rachas@123");
  console.info(`Racha FUT11: ${fut11Racha.name} (${fut11Racha.inviteCode})`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
