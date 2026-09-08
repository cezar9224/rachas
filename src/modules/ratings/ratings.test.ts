import { describe, expect, it } from "vitest";

import { calculateCurrentRating } from "./calculation";
import { playerRatingSchema } from "./schemas";

describe("playerRatingSchema", () => {
  it("accepts ratings from 0 to 10 in half-point intervals", () => {
    expect(playerRatingSchema.parse({ value: "7.5" }).value).toBe(7.5);
    expect(playerRatingSchema.parse({ value: "0" }).value).toBe(0);
    expect(playerRatingSchema.parse({ value: "10" }).value).toBe(10);
  });

  it("rejects values outside the range or interval", () => {
    expect(playerRatingSchema.safeParse({ value: "10.5" }).success).toBe(false);
    expect(playerRatingSchema.safeParse({ value: "7.2" }).success).toBe(false);
  });
});

describe("calculateCurrentRating", () => {
  it("uses the initial rating when there are no peer ratings", () => {
    expect(calculateCurrentRating(7.5, [])).toBe(7.5);
  });

  it("uses the rounded peer average when ratings exist", () => {
    expect(calculateCurrentRating(5, [7.5, 8, 9])).toBe(8.2);
  });
});
