export type CompetitionTeam = { id: string; name: string };
export type CompetitionGame = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
};

export type Standing = CompetitionTeam & {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export function calculateStandings(teams: CompetitionTeam[], games: CompetitionGame[]): Standing[] {
  const table = new Map(teams.map((team) => [team.id, {
    ...team, played: 0, won: 0, drawn: 0, lost: 0,
    goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
  }]));

  for (const game of games) {
    const home = table.get(game.homeTeamId);
    const away = table.get(game.awayTeamId);
    if (!home || !away) continue;
    home.played += 1;
    away.played += 1;
    home.goalsFor += game.homeScore;
    home.goalsAgainst += game.awayScore;
    away.goalsFor += game.awayScore;
    away.goalsAgainst += game.homeScore;
    if (game.homeScore > game.awayScore) { home.won += 1; away.lost += 1; home.points += 3; }
    else if (game.homeScore < game.awayScore) { away.won += 1; home.lost += 1; away.points += 3; }
    else { home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1; }
  }

  for (const row of table.values()) row.goalDifference = row.goalsFor - row.goalsAgainst;
  return [...table.values()].sort((a, b) =>
    b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name),
  );
}
