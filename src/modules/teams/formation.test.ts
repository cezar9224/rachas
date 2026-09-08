import { describe, expect, it } from "vitest";

import { assignFormationCoordinates } from "./formation";

describe("assignFormationCoordinates", () => {
  it("places every player once inside normalized field bounds", () => {
    const players = [
      { id: "gk", primaryPosition: "GOALKEEPER" },
      { id: "def-1", primaryPosition: "DEFENDER" },
      { id: "def-2", primaryPosition: "DEFENDER" },
      { id: "mid-1", primaryPosition: "MIDFIELDER" },
      { id: "mid-2", primaryPosition: null },
      { id: "att-1", primaryPosition: "ATTACKER" },
      { id: "att-2", primaryPosition: "ATTACKER" },
    ];
    const result = assignFormationCoordinates(players, "FUT7");

    expect(result).toHaveLength(players.length);
    expect(new Set(result.map(({ id }) => id)).size).toBe(players.length);
    expect(result.every(({ x, y }) => x >= 0 && x <= 100 && y >= 0 && y <= 100)).toBe(true);
  });

  it("places goalkeepers behind defenders and attackers", () => {
    const result = assignFormationCoordinates([
      { id: "gk", primaryPosition: "GOALKEEPER" },
      { id: "def", primaryPosition: "DEFENDER" },
      { id: "att", primaryPosition: "ATTACKER" },
    ], "FUT11");
    const coordinate = new Map(result.map((entry) => [entry.id, entry]));

    expect(coordinate.get("gk")!.y).toBeGreaterThan(coordinate.get("def")!.y);
    expect(coordinate.get("def")!.y).toBeGreaterThan(coordinate.get("att")!.y);
  });

  it("creates additional rows for large position groups", () => {
    const result = assignFormationCoordinates(
      Array.from({ length: 10 }, (_, index) => ({ id: `def-${index}`, primaryPosition: "DEFENDER" })),
      "FUT7",
    );

    expect(new Set(result.map(({ y }) => y)).size).toBeGreaterThan(1);
  });
});
