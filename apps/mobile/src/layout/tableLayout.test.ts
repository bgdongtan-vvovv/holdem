import { describe, expect, it } from "vitest";
import { createTableLayout } from "./tableLayout";

describe("createTableLayout", () => {
  it.each([2, 6, 9])("places %i landscape seats inside the safe area without duplicates", (seatCount) => {
    const layout = createTableLayout({ width: 844, height: 390, seatCount, orientation: "landscape" });
    const keys = layout.seats.map(({ x, y }) => `${x.toFixed(3)}:${y.toFixed(3)}`);
    expect(new Set(keys).size).toBe(seatCount);
    expect(layout.seats.every(({ x, y }) => x >= 0.04 && x <= 0.96 && y >= 0.08 && y <= 0.9)).toBe(true);
    expect(layout.actionBar.width).toBeGreaterThan(0.3);
  });

  it("uses the long vertical axis for a 9-seat portrait table", () => {
    const layout = createTableLayout({ width: 390, height: 844, seatCount: 9, orientation: "portrait" });
    expect(layout.board.y).toBeLessThan(layout.hero.y);
    expect(layout.actionBar.y).toBeGreaterThan(layout.hero.y);
    expect(layout.seats).toHaveLength(9);
  });

  it("rejects unsupported seat counts", () => {
    expect(() => createTableLayout({ width: 390, height: 844, seatCount: 10, orientation: "portrait" })).toThrow(
      "seatCount must be between 2 and 9",
    );
  });

  it("maintains minimum distance between seats", () => {
    const ls = createTableLayout({ width: 844, height: 390, seatCount: 9, orientation: "landscape" });
    for (let i = 0; i < ls.seats.length; i++) {
      for (let j = i + 1; j < ls.seats.length; j++) {
        const dx = (ls.seats[i].x - ls.seats[j].x) * 844;
        const dy = (ls.seats[i].y - ls.seats[j].y) * 390;
        const dist = Math.sqrt(dx * dx + dy * dy);
        expect(dist).toBeGreaterThanOrEqual(86);
      }
    }

    const pt = createTableLayout({ width: 390, height: 844, seatCount: 9, orientation: "portrait" });
    for (let i = 0; i < pt.seats.length; i++) {
      for (let j = i + 1; j < pt.seats.length; j++) {
        const dx = (pt.seats[i].x - pt.seats[j].x) * 390;
        const dy = (pt.seats[i].y - pt.seats[j].y) * 844;
        const dist = Math.sqrt(dx * dx + dy * dy);
        expect(dist).toBeGreaterThanOrEqual(78);
      }
    }
  });
});
