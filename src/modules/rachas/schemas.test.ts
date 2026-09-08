import { describe, expect, it } from "vitest";

import { FORMAT_CONFIGS, isRachaFormat } from "./formats";
import { createRachaSchema, joinRachaSchema } from "./schemas";

describe("racha formats", () => {
  it("keeps player quantities in configuration", () => {
    expect(FORMAT_CONFIGS.FUT7.outfieldPlayers).toBe(6);
    expect(FORMAT_CONFIGS.FUT11.positions).toHaveLength(8);
    expect(isRachaFormat("CUSTOM")).toBe(true);
    expect(isRachaFormat("BEACH")).toBe(false);
  });
});

describe("createRachaSchema", () => {
  it("coerces valid numeric form values", () => {
    const result = createRachaSchema.parse({
      name: "Racha dos Amigos",
      city: "Fortaleza",
      venue: "Arena Central",
      description: "Sábado à tarde",
      format: "FUT7",
      outfieldPlayers: "6",
      goalkeepersPerTeam: "1",
      teamCount: "2",
    });

    expect(result.outfieldPlayers).toBe(6);
    expect(result.teamCount).toBe(2);
  });

  it("accepts custom configurations above the previous limit", () => {
    const result = createRachaSchema.parse({
      name: "Racha ampliado",
      city: "Fortaleza",
      venue: "Arena Central",
      format: "CUSTOM",
      outfieldPlayers: "30",
      goalkeepersPerTeam: "4",
      teamCount: "10",
    });

    expect(result.outfieldPlayers).toBe(30);
    expect(result.teamCount).toBe(10);
  });

  it("rejects unsafe capacity values", () => {
    const result = createRachaSchema.safeParse({
      name: "Racha dos Amigos",
      city: "Fortaleza",
      venue: "Arena Central",
      format: "FUT7",
      outfieldPlayers: "100",
      goalkeepersPerTeam: "1",
      teamCount: "1",
    });

    expect(result.success).toBe(false);
  });
});

describe("joinRachaSchema", () => {
  it("normalizes invitation codes", () => {
    expect(joinRachaSchema.parse({ inviteCode: " arb7k2 " }).inviteCode).toBe("ARB7K2");
  });
});
