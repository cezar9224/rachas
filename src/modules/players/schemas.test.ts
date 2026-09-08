import { describe, expect, it } from "vitest";

import { validateProfileImage } from "./image-validation";
import { playerProfileSchema } from "./schemas";

describe("playerProfileSchema", () => {
  it("accepts a profile with unique position identifiers", () => {
    const result = playerProfileSchema.parse({
      nickname: "  Dinho ",
      primaryPositionId: "position-1",
      secondaryPositionIds: ["position-2"],
    });

    expect(result.nickname).toBe("Dinho");
  });

  it("limits secondary positions", () => {
    const result = playerProfileSchema.safeParse({
      nickname: "Dinho",
      primaryPositionId: "position-1",
      secondaryPositionIds: ["1", "2", "3", "4", "5"],
    });

    expect(result.success).toBe(false);
  });
});

describe("validateProfileImage", () => {
  it("detects PNG content instead of trusting the file extension", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([bytes], "photo.txt", { type: "text/plain" });

    await expect(validateProfileImage(file)).resolves.toMatchObject({ mimeType: "image/png", bytes });
  });

  it("rejects content that is not a supported image", async () => {
    const file = new File(["not-an-image"], "photo.png", { type: "image/png" });

    await expect(validateProfileImage(file)).rejects.toThrow("JPEG, PNG ou WebP");
  });
});
