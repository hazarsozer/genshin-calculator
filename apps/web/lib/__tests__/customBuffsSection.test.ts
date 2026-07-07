import { describe, it, expect } from "vitest";
import { countActiveCustomBuffs } from "../customBuffKeys.js";

describe("countActiveCustomBuffs", () => {
  it("returns 0 for undefined", () => {
    expect(countActiveCustomBuffs(undefined)).toBe(0);
  });

  it("returns 0 for an empty object", () => {
    expect(countActiveCustomBuffs({})).toBe(0);
  });

  it("counts non-zero entries", () => {
    expect(countActiveCustomBuffs({ atk: 100, crit_rate: 5 })).toBe(2);
  });

  it("excludes zero-valued entries from the count", () => {
    expect(countActiveCustomBuffs({ atk: 100, crit_rate: 0 })).toBe(1);
  });
});
