/**
 * StatTableAscensionWeapon — the INTERPOLATING ascension table (Math.floor lerp).
 *
 * Distinct from StatTableAscensionScale (the char/weapon multiplicative-scale
 * variant, P1.3). This one interpolates between knot levels [1,20,40,50,60,70,
 * 80,90] with a truncating (Math.floor) linear interpolation, then adds the
 * ascension-phase bonus.
 *
 * Expected values derived by replaying her algorithm exactly:
 *   raw/genshin_calc_pub/src/js/classes/StatTable/Ascension.js (getValue)
 *   raw/genshin_calc_pub/src/js/classes/StatTable/Ascension/Weapon.js (getLevels)
 */

import { describe, it, expect } from "vitest";
import { StatTableAscensionWeapon } from "../StatTable.js";

// Values indexed positionally to the knot levels [1,20,40,50,60,70,80,90].
const VALUES = [100, 200, 400, 500, 600, 700, 800, 900] as const;
const ASCENSION = [10, 20, 30, 40, 50, 60] as const;

describe("StatTableAscensionWeapon (interpolating, Math.floor lerp)", () => {
  const table = new StatTableAscensionWeapon("atk_base", [...VALUES], [...ASCENSION]);

  it("returns the stat name via getName()", () => {
    expect(table.getName()).toBe("atk_base");
  });

  it("returns exact knot values at knot levels (ascension 0)", () => {
    expect(table.getValue(1, 0)).toBe(100);
    expect(table.getValue(90, 0)).toBe(900);
  });

  it("adds the ascension-phase bonus at the top knot", () => {
    // level 90 → 900, ascension 6 → +60 = 960
    expect(table.getValue(90, 6)).toBe(960);
  });

  it("truncates (Math.floor) when interpolating between knots", () => {
    // L=10 between knots 1 and 20: 100 + floor(9*100/19) = 100 + 47 = 147
    expect(table.getValue(10, 0)).toBe(147);
    // L=55 between knots 50 and 60: 500 + floor(5*100/10) = 550 (exact)
    expect(table.getValue(55, 0)).toBe(550);
  });

  it("interpolates then adds ascension bonus", () => {
    // L=30 between knots 20 and 40: 200 + floor(10*200/20) = 300; ascension 2 → +20 = 320
    expect(table.getValue(30, 2)).toBe(320);
  });

  it("level <= 0 yields the first value (no short-circuit, faithful to her loop)", () => {
    expect(table.getValue(0, 0)).toBe(100);
  });

  it("ascension out of range contributes 0", () => {
    expect(table.getValue(90, 0)).toBe(900);
    expect(table.getValue(90, 7)).toBe(900); // ascension 7 > length 6 → +0
  });
});
