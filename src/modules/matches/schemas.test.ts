import { describe, expect, it } from "vitest";

import { createMatchSchema, getAttendanceStatus, parseFortalezaDateTime } from "./schemas";

describe("createMatchSchema", () => {
  const validMatch = {
    date: "2030-05-14",
    startTime: "19:20",
    endTime: "20:50",
    venue: "Arena Rio Branco",
    maxPlayers: "14",
    teamCount: "2",
    format: "FUT7",
    outfieldPlayers: "6",
    goalkeepersPerTeam: "1",
  };

  it("accepts and coerces a valid match", () => {
    expect(createMatchSchema.parse(validMatch).maxPlayers).toBe(14);
  });

  it("accepts more than 15 outfield players per team", () => {
    const result = createMatchSchema.parse({
      ...validMatch,
      maxPlayers: "96",
      outfieldPlayers: "30",
      goalkeepersPerTeam: "2",
      teamCount: "3",
    });

    expect(result.outfieldPlayers).toBe(30);
  });

  it("rejects an end time before the start", () => {
    expect(createMatchSchema.safeParse({ ...validMatch, endTime: "18:00" }).success).toBe(false);
  });
});

describe("match time", () => {
  it("interprets match times in America/Fortaleza", () => {
    expect(parseFortalezaDateTime("2030-05-14", "19:20")?.toISOString()).toBe("2030-05-14T22:20:00.000Z");
  });
});

describe("attendance allocation", () => {
  it("confirms while a slot is available", () => {
    expect(getAttendanceStatus(13, 14)).toBe("CONFIRMED");
  });

  it("uses the waiting list when capacity is reached", () => {
    expect(getAttendanceStatus(14, 14)).toBe("WAITING_LIST");
  });
});
