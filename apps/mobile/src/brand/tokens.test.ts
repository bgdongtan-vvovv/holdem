import { describe, expect, it } from "vitest";
import { theme } from "../theme";
import { brandTokens } from "./tokens";

describe("brandTokens", () => {
  it("keeps table text readable and the approved three-color identity stable", () => {
    expect(brandTokens.color).toMatchObject({
      gold: "#D7A83D",
      red: "#A61F2B",
      felt: "#242321",
      surface: "#111111",
      text: "#F5F0E6",
    });
    expect(brandTokens.radius.action).toBe(10);
  });

  it("keeps legacy name plates translucent through a brand token", () => {
    expect(brandTokens.color.surfaceOverlay).toBe("rgba(17,17,17,0.82)");
    expect(theme.namePlate).toBe(brandTokens.color.surfaceOverlay);
  });
});
