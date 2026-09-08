import { describe, expect, it } from "vitest";
import { calculateStandings } from "./competition";

describe("calculateStandings", () => {
  it("orders by points, goal difference and goals scored", () => {
    const table = calculateStandings(
      [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }],
      [
        { homeTeamId: "a", awayTeamId: "b", homeScore: 2, awayScore: 0 },
        { homeTeamId: "b", awayTeamId: "c", homeScore: 1, awayScore: 1 },
        { homeTeamId: "c", awayTeamId: "a", homeScore: 0, awayScore: 0 },
      ],
    );
    expect(table.map(({ id }) => id)).toEqual(["a", "c", "b"]);
    expect(table[0]).toMatchObject({ points: 4, played: 2, goalDifference: 2 });
  });
});
