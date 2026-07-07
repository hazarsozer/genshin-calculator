import { describe, it, expect } from "vitest";
import { ALL_CHARACTERS, ALL_WEAPONS, bennett } from "../index.js";

describe("roster arrays", () => {
  it("ALL_CHARACTERS includes the full ported roster and a known member", () => {
    expect(ALL_CHARACTERS.length).toBeGreaterThanOrEqual(107);
    expect(ALL_CHARACTERS).toContain(bennett);
    expect(new Set(ALL_CHARACTERS.map((c) => c.name)).size).toBe(ALL_CHARACTERS.length);
  });
  it("ALL_WEAPONS is non-empty and unique by name", () => {
    expect(ALL_WEAPONS.length).toBeGreaterThanOrEqual(200);
    expect(new Set(ALL_WEAPONS.map((w) => w.name)).size).toBe(ALL_WEAPONS.length);
  });
});
