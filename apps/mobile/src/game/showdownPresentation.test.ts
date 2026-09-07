import { describe, expect, it } from "vitest";
import { shouldStartShowdownPresentation } from "./showdownPresentation";

describe("shouldStartShowdownPresentation", () => {
  it("starts while the engine is in its showdown street", () => {
    expect(shouldStartShowdownPresentation("showdown")).toBe(true);
  });

  it("does not start after a non-showdown hand completes", () => {
    expect(shouldStartShowdownPresentation("complete")).toBe(false);
  });
});
