import { describe, expect, it } from "vitest";

import { balanceTeams, type TeamBalancerPlayer } from "./team-balancer";

function players(count: number, goalkeeperCount: number, ratings?: number[]): TeamBalancerPlayer[] {
  const positions = ["DEFENDER", "MIDFIELDER", "ATTACKER"];
  return Array.from({ length: count }, (_, index) => ({
    id: `player-${index}`,
    isGoalkeeper: index < goalkeeperCount,
    name: `Jogador ${index}`,
    primaryPosition: index < goalkeeperCount ? "GOALKEEPER" : positions[index % positions.length],
    rating: ratings?.[index] ?? 6 + ((index * 7) % 25) / 10,
    secondaryPositions: index < goalkeeperCount ? [] : [positions[(index + 1) % positions.length]],
  }));
}

function expectValid(result: ReturnType<typeof balanceTeams>, expectedPlayers: number, teamCount: number, teamSize: number) {
  const ids = result.teams.flatMap((team) => team.players.map(({ id }) => id));
  expect(result.teams).toHaveLength(teamCount);
  expect(ids).toHaveLength(expectedPlayers);
  expect(new Set(ids).size).toBe(expectedPlayers);
  expect(result.teams.every((team) => team.players.length === teamSize)).toBe(true);
}

describe("balanceTeams", () => {
  it("balances 10 players into two teams of five", () => {
    const result = balanceTeams({ players: players(10, 2), teamCount: 2, playersPerTeam: 5 });
    expectValid(result, 10, 2, 5);
    expect(result.ratingDifference).toBeLessThanOrEqual(0.3);
  });

  it("balances 14 players into two FUT7 teams", () => {
    const result = balanceTeams({ players: players(14, 2), teamCount: 2, playersPerTeam: 7 });
    expectValid(result, 14, 2, 7);
    expect(result.teams.every((team) => team.players.filter(({ isGoalkeeper }) => isGoalkeeper).length === 1)).toBe(true);
  });

  it("balances 21 players into three teams", () => {
    const result = balanceTeams({ players: players(21, 3), teamCount: 3, playersPerTeam: 7 });
    expectValid(result, 21, 3, 7);
    expect(result.teams.every((team) => team.players.some(({ isGoalkeeper }) => isGoalkeeper))).toBe(true);
  });

  it("minimizes large rating differences", () => {
    const ratings = [10, 9.5, 9, 8.5, 8, 7.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1];
    const result = balanceTeams({ players: players(14, 2, ratings), teamCount: 2, playersPerTeam: 7 });
    expect(result.ratingDifference).toBeLessThanOrEqual(0.2);
  });

  it("distributes multiple goalkeepers evenly", () => {
    const result = balanceTeams({ players: players(14, 4), teamCount: 2, playersPerTeam: 7 });
    const counts = result.teams.map((team) => team.players.filter(({ isGoalkeeper }) => isGoalkeeper).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("keeps position coverage balanced", () => {
    const result = balanceTeams({ players: players(14, 2), teamCount: 2, playersPerTeam: 7 });
    for (const position of ["DEFENDER", "MIDFIELDER", "ATTACKER"]) {
      const counts = result.teams.map((team) => team.players.filter((player) => player.primaryPosition === position || player.secondaryPositions.includes(position)).length);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });

  it("keeps at most six outfield players in five FUT7 teams when goalkeepers are missing", () => {
    const result = balanceTeams({ players: players(32, 2), teamCount: 5, playersPerTeam: 7, goalkeepersPerTeam: 1 });
    const ids = result.teams.flatMap((team) => team.players.map(({ id }) => id));

    expect(result.teams).toHaveLength(5);
    expect(new Set(ids).size).toBe(32);
    expect(result.teams.every((team) => team.players.filter(({ isGoalkeeper }) => !isGoalkeeper).length <= 6)).toBe(true);
    expect(result.teams.map((team) => team.players.filter(({ isGoalkeeper }) => isGoalkeeper).length).sort()).toEqual([0, 0, 0, 1, 1]);
  });
});
