import { describe, it, expect } from "vitest";
import { talentCap, TALENT_CAPS } from "../levelTable.js";

describe("talentCap — talent level cap by ascension", () => {
  // Faithful to her engine: SKILL_LEVELS = StatTable([1,2,4,6,8,10]) read via
  // getValue(ascension || 1) (raw/.../classes/CalcObject/Character.js:4,99).
  it("caps each ascension phase per the game rule [1,1,2,4,6,8,10]", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(talentCap)).toEqual([1, 1, 2, 4, 6, 8, 10]);
    expect(TALENT_CAPS).toEqual([1, 1, 2, 4, 6, 8, 10]);
  });

  it("ascension 0 and 1 both cap at 1 (her `ascension || 1`)", () => {
    expect(talentCap(0)).toBe(1);
    expect(talentCap(1)).toBe(1);
  });

  it("clamps out-of-range ascension into [0,6]", () => {
    expect(talentCap(-1)).toBe(1);
    expect(talentCap(7)).toBe(10);
  });
});
