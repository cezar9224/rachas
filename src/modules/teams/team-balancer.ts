export type TeamBalancerPlayer = {
  id: string;
  isGoalkeeper: boolean;
  name: string;
  primaryPosition: string | null;
  primaryPositionId?: string | null;
  rating: number;
  secondaryPositions: string[];
};

export type BalancedTeam = {
  averageRating: number;
  players: TeamBalancerPlayer[];
};

export type TeamBalanceResult = {
  balanceScore: number;
  ratingDifference: number;
  teams: BalancedTeam[];
};

type TeamBalancerOptions = {
  goalkeepersPerTeam?: number;
  iterations?: number;
  players: TeamBalancerPlayer[];
  playersPerTeam: number;
  seed?: number;
  teamCount: number;
};

export function balanceTeams({
  goalkeepersPerTeam = 1,
  iterations = 2000,
  players,
  playersPerTeam,
  seed = 20260903,
  teamCount,
}: TeamBalancerOptions): TeamBalanceResult {
  validateInput(players, teamCount, playersPerTeam);

  const random = createRandom(seed);
  const targetSizes = getTargetSizes(players.length, teamCount);
  let bestTeams: TeamBalancerPlayer[][] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let iteration = 0; iteration < Math.max(1, Math.min(iterations, 10_000)); iteration += 1) {
    const candidate = createCandidate(players, targetSizes, goalkeepersPerTeam, random);
    improveCandidate(candidate, goalkeepersPerTeam, random, 40);
    const score = calculateBalanceScore(candidate, targetSizes, goalkeepersPerTeam);

    if (score < bestScore) {
      bestScore = score;
      bestTeams = candidate.map((team) => [...team]);
    }
  }

  if (!bestTeams) throw new Error("Não foi possível montar os times.");

  const averages = bestTeams.map(getAverageRating);
  return {
    balanceScore: round(bestScore, 4),
    ratingDifference: round(Math.max(...averages) - Math.min(...averages), 2),
    teams: bestTeams.map((team, index) => ({
      averageRating: round(averages[index], 2),
      players: team,
    })),
  };
}

function validateInput(players: TeamBalancerPlayer[], teamCount: number, playersPerTeam: number) {
  if (!Number.isInteger(teamCount) || teamCount < 2) throw new Error("Use pelo menos dois times.");
  if (!Number.isInteger(playersPerTeam) || playersPerTeam < 1) throw new Error("Capacidade de time inválida.");
  if (players.length < teamCount) throw new Error("Não há jogadores suficientes para formar os times.");
  if (players.length > teamCount * playersPerTeam) throw new Error("Há mais jogadores do que vagas nos times.");
  if (new Set(players.map(({ id }) => id)).size !== players.length) throw new Error("Existem jogadores duplicados.");
}

function getTargetSizes(playerCount: number, teamCount: number) {
  const minimum = Math.floor(playerCount / teamCount);
  const remainder = playerCount % teamCount;
  return Array.from({ length: teamCount }, (_, index) => minimum + (index < remainder ? 1 : 0));
}

function createCandidate(
  players: TeamBalancerPlayer[],
  targetSizes: number[],
  goalkeepersPerTeam: number,
  random: () => number,
) {
  const teams = targetSizes.map(() => [] as TeamBalancerPlayer[]);
  const goalkeepers = shuffle(players.filter(({ isGoalkeeper }) => isGoalkeeper), random);
  const outfield = shuffle(players.filter(({ isGoalkeeper }) => !isGoalkeeper), random);

  for (let round = 0; round < goalkeepersPerTeam; round += 1) {
    const teamOrder = [...teams.keys()].sort((first, second) => targetSizes[second] - targetSizes[first] || first - second);
    for (const teamIndex of teamOrder) {
      const goalkeeper = goalkeepers.shift();
      if (!goalkeeper) break;
      if (teams[teamIndex].length < targetSizes[teamIndex]) teams[teamIndex].push(goalkeeper);
      else goalkeepers.unshift(goalkeeper);
    }
  }

  const remaining = shuffle([...goalkeepers, ...outfield], random);
  for (const player of remaining) {
    const available = teams
      .map((team, index) => ({ index, vacancies: targetSizes[index] - team.length }))
      .filter(({ vacancies }) => vacancies > 0);
    const selected = available[Math.floor(random() * available.length)];
    teams[selected.index].push(player);
  }

  return teams;
}

function improveCandidate(teams: TeamBalancerPlayer[][], goalkeepersPerTeam: number, random: () => number, attempts: number) {
  const targetSizes = teams.map(({ length }) => length);
  let score = calculateBalanceScore(teams, targetSizes, goalkeepersPerTeam);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const firstTeam = Math.floor(random() * teams.length);
    let secondTeam = Math.floor(random() * teams.length);
    if (firstTeam === secondTeam) secondTeam = (secondTeam + 1) % teams.length;
    const firstPlayer = Math.floor(random() * teams[firstTeam].length);
    const secondPlayer = Math.floor(random() * teams[secondTeam].length);

    [teams[firstTeam][firstPlayer], teams[secondTeam][secondPlayer]] = [teams[secondTeam][secondPlayer], teams[firstTeam][firstPlayer]];
    const nextScore = calculateBalanceScore(teams, targetSizes, goalkeepersPerTeam);
    if (nextScore <= score) score = nextScore;
    else [teams[firstTeam][firstPlayer], teams[secondTeam][secondPlayer]] = [teams[secondTeam][secondPlayer], teams[firstTeam][firstPlayer]];
  }
}

function calculateBalanceScore(teams: TeamBalancerPlayer[][], targetSizes: number[], goalkeepersPerTeam: number) {
  const averages = teams.map(getAverageRating);
  const ratingPenalty = (Math.max(...averages) - Math.min(...averages)) ** 2 * 100;
  const sizePenalty = teams.reduce((sum, team, index) => sum + Math.abs(team.length - targetSizes[index]) * 1000, 0);
  const totalGoalkeepers = teams.flat().filter(({ isGoalkeeper }) => isGoalkeeper).length;
  const baseGoalkeepers = Math.min(goalkeepersPerTeam, Math.floor(totalGoalkeepers / teams.length));
  const goalkeeperRemainder = Math.min(teams.length, totalGoalkeepers - baseGoalkeepers * teams.length);
  const goalkeeperPenalty = teams.reduce(
    (sum, team, index) => {
      const expectedGoalkeepers = baseGoalkeepers + (index < goalkeeperRemainder ? 1 : 0);
      return sum + Math.abs(team.filter(({ isGoalkeeper }) => isGoalkeeper).length - expectedGoalkeepers) * 1000;
    },
    0,
  );
  const positionPenalty = ["DEFENDER", "MIDFIELDER", "ATTACKER"].reduce((sum, position) => {
    const counts = teams.map((team) => team.filter((player) => player.primaryPosition === position || player.secondaryPositions.includes(position)).length);
    return sum + (Math.max(...counts) - Math.min(...counts)) * 4;
  }, 0);

  return ratingPenalty + sizePenalty + goalkeeperPenalty + positionPenalty;
}

function getAverageRating(team: TeamBalancerPlayer[]) {
  return team.reduce((sum, { rating }) => sum + rating, 0) / team.length;
}

function shuffle<T>(items: T[], random: () => number) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

function createRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4_294_967_296;
  };
}

function round(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
