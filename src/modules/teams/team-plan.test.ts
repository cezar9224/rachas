import { describe, expect, it } from "vitest";
import { calculateTeamPlan } from "./team-plan";

describe("calculateTeamPlan", () => {
  it("creates three Fut11 teams from 30 outfield players", () => {
    expect(calculateTeamPlan({ outfieldCount: 30, goalkeeperCount: 2, outfieldPlayersPerTeam: 10, goalkeepersPerTeam: 1 }))
      .toEqual({ teamCount: 3, playersPerTeam: 11, missingGoalkeepers: 1 });
  });

  it("creates five futsal teams from 20 outfield players", () => {
    expect(calculateTeamPlan({ outfieldCount: 20, goalkeeperCount: 5, outfieldPlayersPerTeam: 4, goalkeepersPerTeam: 1 }))
      .toEqual({ teamCount: 5, playersPerTeam: 5, missingGoalkeepers: 0 });
  });

  it("uses custom players per team", () => {
    expect(calculateTeamPlan({ outfieldCount: 18, goalkeeperCount: 3, outfieldPlayersPerTeam: 6, goalkeepersPerTeam: 1 }).teamCount).toBe(3);
  });
});
