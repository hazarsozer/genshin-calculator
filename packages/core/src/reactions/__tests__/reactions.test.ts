/**
 * Reaction tests — P1.6 (amplifying, transformative, Lunar-Charged CRIT).
 *
 * Strategy: test the formula math with controlled inputs derived directly from
 * the wiki concept pages and her raw source. No oracle calls — those land in P1.8.
 *
 * Sources:
 *   wiki/concepts/amplifying-reactions.md
 *   wiki/concepts/transformative-reactions.md
 *   wiki/concepts/elemental-mastery.md
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/Amplifying.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/Transformative.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/LunarCharged.js
 *   raw/genshin_calc_pub/src/js/db/generated/ElementScale.js
 */

import { describe, it, expect } from "vitest";
import type { DamageContext } from "@genshin/types";
import {
  cAmplifyingEmBonus,
  cAmplifyingFactor,
  AmplifyingVariant,
} from "../amplifying.js";
import {
  REACTION_LEVEL_MULTIPLIERS,
  cTransformativeEmBonus,
  cTransformativeDamage,
} from "../transformative.js";
import {
  cLunarChargedEmBonus,
  cLunarChargedDamage,
} from "../lunar.js";
import { compile } from "../../compile/index.js";

/** Build a minimal DamageContext with the given stats. */
function ctx(
  stats: Record<string, number>,
  characterLevel = 90,
  enemyLevel = 90
): DamageContext {
  return {
    stats,
    enemy: { level: enemyLevel, resistance: {} },
    characterLevel,
  };
}

// ---------------------------------------------------------------------------
// Amplifying EM bonus: 2.78 × EM / (EM + 1400)
// ---------------------------------------------------------------------------

describe("amplifying EM bonus — 2.78 × EM / (EM + 1400)", () => {
  it("EM = 0 → bonus = 0", () => {
    const block = cAmplifyingEmBonus();
    const fn = compile(block);
    // compile on a non-DamageBlock returns avg scalar
    expect(fn(ctx({ mastery: 0 })).avg).toBeCloseTo(0, 12);
  });

  it("EM = 1400 → 2.78 × 1400/2800 = 1.39  (half-max point)", () => {
    const block = cAmplifyingEmBonus();
    const fn = compile(block);
    expect(fn(ctx({ mastery: 1400 })).avg).toBeCloseTo(2.78 * (1400 / 2800), 9);
  });

  it("EM = 200 → 2.78 × 200/1600 ≈ 0.3475", () => {
    const block = cAmplifyingEmBonus();
    const fn = compile(block);
    expect(fn(ctx({ mastery: 200 })).avg).toBeCloseTo(2.78 * (200 / 1600), 9);
  });
});

// ---------------------------------------------------------------------------
// cAmplifyingFactor: baseMultiplier × (1 + emBonus + reactionPct)
// ---------------------------------------------------------------------------

describe("cAmplifyingFactor — full amplifying multiplier block", () => {
  it("vaporize forward (×2.0), EM=0, no bonus → 2.0", () => {
    const block = cAmplifyingFactor({ variant: AmplifyingVariant.VaporizeForward });
    const fn = compile(block);
    expect(fn(ctx({ mastery: 0 })).avg).toBeCloseTo(2.0, 12);
  });

  it("vaporize reverse (×1.5), EM=0, no bonus → 1.5", () => {
    const block = cAmplifyingFactor({ variant: AmplifyingVariant.VaporizeReverse });
    const fn = compile(block);
    expect(fn(ctx({ mastery: 0 })).avg).toBeCloseTo(1.5, 12);
  });

  it("melt forward (×2.0), EM=0, no bonus → 2.0", () => {
    const block = cAmplifyingFactor({ variant: AmplifyingVariant.MeltForward });
    const fn = compile(block);
    expect(fn(ctx({ mastery: 0 })).avg).toBeCloseTo(2.0, 12);
  });

  it("melt reverse (×1.5), EM=0, no bonus → 1.5", () => {
    const block = cAmplifyingFactor({ variant: AmplifyingVariant.MeltReverse });
    const fn = compile(block);
    expect(fn(ctx({ mastery: 0 })).avg).toBeCloseTo(1.5, 12);
  });

  it("vaporize forward, EM=1400, no bonus → 2 × (1 + 1.39) = 4.78", () => {
    const block = cAmplifyingFactor({ variant: AmplifyingVariant.VaporizeForward });
    const fn = compile(block);
    const emBonus = 2.78 * (1400 / 2800);
    expect(fn(ctx({ mastery: 1400 })).avg).toBeCloseTo(2 * (1 + emBonus), 9);
  });

  it("vaporize forward, EM=0, reaction bonus 0.15 (Crimson Witch 4pc partial) → 2 × 1.15 = 2.3", () => {
    const block = cAmplifyingFactor({
      variant: AmplifyingVariant.VaporizeForward,
      reactionBonusKeys: ["dmg_reaction_vaporize"],
    });
    const fn = compile(block);
    expect(fn(ctx({ mastery: 0, dmg_reaction_vaporize: 0.15 })).avg).toBeCloseTo(
      2 * (1 + 0.15),
      12
    );
  });

  it("vaporize forward, EM=200, reaction bonus 0.15 → 2 × (1 + emBonus + 0.15)", () => {
    const block = cAmplifyingFactor({
      variant: AmplifyingVariant.VaporizeForward,
      reactionBonusKeys: ["dmg_reaction_vaporize"],
    });
    const fn = compile(block);
    const emBonus = 2.78 * (200 / (200 + 1400));
    expect(fn(ctx({ mastery: 200, dmg_reaction_vaporize: 0.15 })).avg).toBeCloseTo(
      2 * (1 + emBonus + 0.15),
      9
    );
  });
});

// ---------------------------------------------------------------------------
// Transformative level multiplier table (from raw ElementScale.js)
// ---------------------------------------------------------------------------

describe("REACTION_LEVEL_MULTIPLIERS — extracted from ElementScale.js", () => {
  it("has exactly 90 entries (one per character level)", () => {
    expect(REACTION_LEVEL_MULTIPLIERS.length).toBe(90);
  });

  it("level 1 = 17.1656 (first entry, raw/…/ElementScale.js:5)", () => {
    expect(REACTION_LEVEL_MULTIPLIERS[0]).toBeCloseTo(17.1656, 4);
  });

  it("level 90 = 1446.8535 (last entry, raw/…/ElementScale.js:13)", () => {
    expect(REACTION_LEVEL_MULTIPLIERS[89]).toBeCloseTo(1446.8535, 4);
  });

  it("level 86 = 1288.9528 (raw/…/ElementScale.js:13, index 85)", () => {
    // 0-indexed: index 85 = character level 86
    expect(REACTION_LEVEL_MULTIPLIERS[85]).toBeCloseTo(1288.9528, 4);
  });
});

// ---------------------------------------------------------------------------
// Transformative EM bonus: 16 × EM / (EM + 2000)
// ---------------------------------------------------------------------------

describe("transformative EM bonus — 16 × EM / (EM + 2000)", () => {
  it("EM = 0 → bonus = 0", () => {
    const block = cTransformativeEmBonus();
    const fn = compile(block);
    expect(fn(ctx({ mastery: 0 })).avg).toBeCloseTo(0, 12);
  });

  it("EM = 2000 → 16 × 2000/4000 = 8 (as a multiplier contribution)", () => {
    const block = cTransformativeEmBonus();
    const fn = compile(block);
    expect(fn(ctx({ mastery: 2000 })).avg).toBeCloseTo(16 * (2000 / 4000), 9);
  });

  it("EM = 200 → 16 × 200 / 2200 ≈ 1.4545…", () => {
    const block = cTransformativeEmBonus();
    const fn = compile(block);
    expect(fn(ctx({ mastery: 200 })).avg).toBeCloseTo(16 * (200 / 2200), 9);
  });
});

// ---------------------------------------------------------------------------
// cTransformativeDamage — full standalone transformative hit
// Overload (×2.0, pyro element) at level 90
// ---------------------------------------------------------------------------

describe("cTransformativeDamage — full pipeline", () => {
  // Overload: reactionMultiplier=2.0, element=pyro, lv90 levelMult=1446.8535
  // resMult: enemy_res_pyro=0.1 → 1-0.1=0.9
  // EM=0: emBonus=0, reactionBonus=0 → (1+0+0)=1
  // damage = 2.0 × 1446.8535 × 1 × 0.9 = 2604.3363
  const LV90_MULT = 1446.8535;

  it("Overload, level 90, EM=0, 10% pyro res → 2.0 × LV90 × 1 × 0.9", () => {
    const tree = cTransformativeDamage({
      reactionMultiplier: 2.0,
      element: "pyro",
      characterLevel: 90,
    });
    const fn = compile(tree);
    const c = ctx({ mastery: 0, enemy_res_pyro: 0.1 });
    const expected = 2.0 * LV90_MULT * 1 * 0.9;
    const { normal, crit, avg } = fn(c);
    // Transformative cannot crit → normal = crit = avg
    expect(normal).toBeCloseTo(expected, 3);
    expect(crit).toBeCloseTo(expected, 3);
    expect(avg).toBeCloseTo(expected, 3);
  });

  it("Overload, level 90, EM=400, no res → 2.0 × LV90 × (1 + emBonus)", () => {
    const tree = cTransformativeDamage({
      reactionMultiplier: 2.0,
      element: "pyro",
      characterLevel: 90,
    });
    const fn = compile(tree);
    const emBonus = 16 * (400 / (400 + 2000));
    const expected = 2.0 * LV90_MULT * (1 + emBonus) * 1; // no res penalty
    const { avg } = fn(ctx({ mastery: 400, enemy_res_pyro: 0 }));
    expect(avg).toBeCloseTo(expected, 3);
  });

  it("Superconduct, ×0.5, level 90, EM=0, no res → 0.5 × LV90", () => {
    const tree = cTransformativeDamage({
      reactionMultiplier: 0.5,
      element: "cryo",
      characterLevel: 90,
    });
    const fn = compile(tree);
    const expected = 0.5 * LV90_MULT;
    const { avg } = fn(ctx({ mastery: 0, enemy_res_cryo: 0 }));
    expect(avg).toBeCloseTo(expected, 3);
  });

  it("Overload, level 90, reaction bonus 0.1 → includes in (1 + emBonus + reactionBonus)", () => {
    const tree = cTransformativeDamage({
      reactionMultiplier: 2.0,
      element: "pyro",
      characterLevel: 90,
      reactionBonusKeys: ["dmg_reaction_overload"],
    });
    const fn = compile(tree);
    const expected = 2.0 * LV90_MULT * (1 + 0.1) * 1; // no res
    const { avg } = fn(ctx({ mastery: 0, dmg_reaction_overload: 0.1, enemy_res_pyro: 0 }));
    expect(avg).toBeCloseTo(expected, 3);
  });

  it("level 1 uses first entry of table (17.1656)", () => {
    const tree = cTransformativeDamage({
      reactionMultiplier: 2.0,
      element: "pyro",
      characterLevel: 1,
    });
    const fn = compile(tree);
    const LV1_MULT = 17.1656;
    const expected = 2.0 * LV1_MULT * 1 * 1; // no res
    const { avg } = fn(ctx({ mastery: 0, enemy_res_pyro: 0 }));
    expect(avg).toBeCloseTo(expected, 3);
  });
});

// ---------------------------------------------------------------------------
// Lunar-Charged EM bonus: 6 × EM / (EM + 2000)
// ---------------------------------------------------------------------------

describe("Lunar-Charged EM bonus — 6 × EM / (EM + 2000)", () => {
  it("EM = 0 → bonus = 0", () => {
    const block = cLunarChargedEmBonus();
    const fn = compile(block);
    expect(fn(ctx({ mastery: 0 })).avg).toBeCloseTo(0, 12);
  });

  it("EM = 2000 → 6 × 2000/4000 = 3", () => {
    const block = cLunarChargedEmBonus();
    const fn = compile(block);
    expect(fn(ctx({ mastery: 2000 })).avg).toBeCloseTo(6 * (2000 / 4000), 9);
  });

  it("EM = 400 → 6 × 400/2400 = 1.0", () => {
    const block = cLunarChargedEmBonus();
    const fn = compile(block);
    expect(fn(ctx({ mastery: 400 })).avg).toBeCloseTo(6 * (400 / 2400), 9);
  });
});

// ---------------------------------------------------------------------------
// cLunarChargedDamage — CRIT-capable transformative
// Lunar-Charged: rate=1.8, uses 6×EM/(EM+2000), crits via crit_rate/crit_dmg
// ---------------------------------------------------------------------------

describe("cLunarChargedDamage — CRIT hook", () => {
  const LV90_MULT = 1446.8535;

  it("no crit, EM=0, no res → 1.8 × LV90, crit=normal=avg (no crit stats)", () => {
    const tree = cLunarChargedDamage({
      element: "electro",
      characterLevel: 90,
    });
    const fn = compile(tree);
    const expected = 1.8 * LV90_MULT;
    const { normal, crit, avg } = fn(ctx({ mastery: 0, enemy_res_electro: 0 }));
    expect(normal).toBeCloseTo(expected, 3);
    expect(crit).toBeCloseTo(expected, 3);
    expect(avg).toBeCloseTo(expected, 3);
  });

  it("with crit, EM=0: normal, crit, avg match the standard crit formula", () => {
    const tree = cLunarChargedDamage({
      element: "electro",
      characterLevel: 90,
      critRateKeys: ["crit_rate"],
      critDmgKeys: ["crit_dmg"],
    });
    const fn = compile(tree);
    const base = 1.8 * LV90_MULT;
    const { normal, crit, avg } = fn(
      ctx({ mastery: 0, enemy_res_electro: 0, crit_rate: 0.5, crit_dmg: 1.0 })
    );
    // crit_rate=0.5, crit_dmg=1.0 → crit = normal × 2, avg = normal×(1+0.5×1.0)
    expect(normal).toBeCloseTo(base, 3);
    expect(crit).toBeCloseTo(base * 2, 3);
    expect(avg).toBeCloseTo(base * 1.5, 3);
  });

  it("EM bonus reduces expected damage correctly (6×EM/(EM+2000) path)", () => {
    const tree = cLunarChargedDamage({
      element: "electro",
      characterLevel: 90,
    });
    const fn = compile(tree);
    const emBonus = 6 * (400 / (400 + 2000));
    const expected = 1.8 * LV90_MULT * (1 + emBonus);
    const { avg } = fn(ctx({ mastery: 400, enemy_res_electro: 0 }));
    expect(avg).toBeCloseTo(expected, 3);
  });

  it("overcapped crit rate clamps: avg ≈ crit when crit_rate≥1", () => {
    const tree = cLunarChargedDamage({
      element: "electro",
      characterLevel: 90,
      critRateKeys: ["crit_rate"],
      critDmgKeys: ["crit_dmg"],
    });
    const fn = compile(tree);
    const { crit, avg } = fn(
      ctx({ mastery: 0, enemy_res_electro: 0, crit_rate: 1.5, crit_dmg: 0.8 })
    );
    expect(avg).toBeCloseTo(crit, 9);
  });

  it("resistance multiplier applies to Lunar-Charged (same piecewise as normal hits)", () => {
    const tree = cLunarChargedDamage({
      element: "electro",
      characterLevel: 90,
    });
    const fn = compile(tree);
    const base = 1.8 * LV90_MULT;
    // 10% res → ×0.9
    const { avg } = fn(ctx({ mastery: 0, enemy_res_electro: 0.1 }));
    expect(avg).toBeCloseTo(base * 0.9, 3);
  });
});
