/**
 * Damage compiler tests — the crown-jewel engine core (P1.5).
 *
 * Strategy (per the task spec): build CONTROLLED block trees and assert the
 * exact formula math from the wiki concept pages. The full-build oracle match
 * (her real Hu Tao numbers) is wired in P1.8 — here we prove the formula
 * pipeline reproduces:
 *
 *   normal = baseDamage × (1 + Σ dmgBonus) × defMult × resMult
 *   crit   = normal × (1 + critDMG)
 *   avg    = normal × (1 + critRate × critDMG)
 *
 * Sources:
 *   wiki/concepts/damage-formula.md
 *   wiki/concepts/base-damage-and-scaling.md
 *   wiki/concepts/def-multiplier.md
 *   wiki/concepts/res-multiplier.md
 *   wiki/concepts/crit.md
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Compile/Types/Damage.js (CDamage.makeResult, L86-126)
 */

import { describe, it, expect } from "vitest";
import type { DamageContext } from "@genshin/types";
import {
  cConst,
  cStat,
  cSum,
  cSubtract,
  cMulti,
  cDivide,
  cMin,
  cMax,
  cFloor,
  cBaseDamage,
  cMultiplierBonus,
  cMultiplierReaction,
  cMultiplierDefence,
  cMultiplierResistance,
  cCritRate,
  cCritDmg,
} from "../blocks.js";
import { cDamage, isDamageBlock } from "../damage.js";
import { compile, runBlock } from "../compiler.js";

/** A controlled context. Stats are stored as the engine sees them at execution
 * time: percent stats are already FRACTIONS (her processPercent divides by 100
 * once before the formula runs). See wiki/concepts/stat-keys-and-good-format.md. */
function ctx(stats: Record<string, number>, characterLevel = 90, enemyLevel = 90): DamageContext {
  return {
    stats,
    enemy: { level: enemyLevel, resistance: {} },
    characterLevel,
  };
}

describe("leaf + arithmetic blocks", () => {
  it("cConst evaluates to its value", () => {
    expect(runBlock(cConst(3), ctx({}))).toBe(3);
  });

  it("cStat reads a stat key (0 when absent)", () => {
    expect(runBlock(cStat("atk"), ctx({ atk: 42 }))).toBe(42);
    expect(runBlock(cStat("missing"), ctx({}))).toBe(0);
  });

  it("cSum adds children; empty sum is 0", () => {
    expect(runBlock(cSum([cConst(1), cConst(2), cConst(3)]), ctx({}))).toBe(6);
    expect(runBlock(cSum([]), ctx({}))).toBe(0);
  });

  it("cSubtract subtracts left-to-right", () => {
    expect(runBlock(cSubtract([cConst(10), cConst(3), cConst(2)]), ctx({}))).toBe(5);
  });

  it("cMulti multiplies children; empty product is 1", () => {
    expect(runBlock(cMulti([cConst(2), cConst(3), cConst(4)]), ctx({}))).toBe(24);
    expect(runBlock(cMulti([]), ctx({}))).toBe(1);
  });

  it("cDivide divides left-to-right", () => {
    expect(runBlock(cDivide([cConst(100), cConst(4), cConst(5)]), ctx({}))).toBe(5);
  });

  it("cMin / cMax", () => {
    expect(runBlock(cMin([cConst(3), cConst(1), cConst(2)]), ctx({}))).toBe(1);
    expect(runBlock(cMax([cConst(3), cConst(1), cConst(2)]), ctx({}))).toBe(3);
  });

  it("cFloor floors its child (truncates toward -∞)", () => {
    expect(runBlock(cFloor(cConst(3.9)), ctx({}))).toBe(3);
    expect(runBlock(cFloor(cConst(5)), ctx({}))).toBe(5);
    // floor(hp / divisor) — the kirara C1 coefficient shape.
    expect(runBlock(cFloor(cDivide([cStat("hp_total"), cConst(8000)])), ctx({ hp_total: 31503 }))).toBe(3);
    // floor THEN min(cap): floor(45000/8000)=5, capped at 4.
    expect(
      runBlock(cMin([cFloor(cDivide([cStat("hp_total"), cConst(8000)])), cConst(4)]), ctx({ hp_total: 45000 }))
    ).toBe(4);
  });
});

describe("damage-specific factor blocks", () => {
  it("cBaseDamage = Σ(talent% × scalingStat) + flat", () => {
    // 0.499824 × 1500 + 0 = 749.736
    const base = cBaseDamage([cMulti([cConst(0.499824), cStat("atk_total")])]);
    expect(runBlock(base, ctx({ atk_total: 1500 }))).toBeCloseTo(749.736, 6);
  });

  it("cMultiplierBonus is additive then (1 + Σ)", () => {
    // dmg_pyro 0.15 + dmg_normal 0.10 → 1.25
    const bonus = cMultiplierBonus([cStat("dmg_pyro"), cStat("dmg_normal")]);
    expect(runBlock(bonus, ctx({ dmg_pyro: 0.15, dmg_normal: 0.1 }))).toBeCloseTo(1.25, 12);
    // empty bonus → 1
    expect(runBlock(cMultiplierBonus([]), ctx({}))).toBe(1);
  });

  it("cMultiplierDefence = (cl+100) / ((cl+100) + (el+100)(1-reduce)(1-ignore))", () => {
    // equal levels, no shred/ignore → 190 / (190+190) = 0.5
    const def = cMultiplierDefence();
    expect(runBlock(def, ctx({}))).toBeCloseTo(0.5, 12);
    // 20% DEF shred (Zhongli) → 190 / (190 + 190*0.8) = 190/342 = 0.5555…
    expect(runBlock(def, ctx({ enemy_def_reduce: 0.2 }))).toBeCloseTo(190 / (190 + 190 * 0.8), 12);
    // DEF ignore stacks multiplicatively with reduce
    expect(
      runBlock(def, ctx({ enemy_def_reduce: 0.2, enemy_def_ignore: 0.5 }))
    ).toBeCloseTo(190 / (190 + 190 * 0.8 * 0.5), 12);
    // Multiple ignore keys (base + per-damage-type) are SUMMED inside (1 - Σ),
    // faithful to her getStatsDefIgnore (Damage.js:128-137).
    const defTyped = cMultiplierDefence("enemy_def_reduce", [
      "enemy_def_ignore",
      "enemy_def_ignore_charged",
    ]);
    expect(
      runBlock(defTyped, ctx({ enemy_def_ignore: 0.2, enemy_def_ignore_charged: 0.3 }))
    ).toBeCloseTo(190 / (190 + 190 * (1 - 0.5)), 12); // Σignore = 0.5
  });

  it("cMultiplierResistance — three piecewise branches", () => {
    const res = (element: string) => cMultiplierResistance(element);
    // 0 ≤ r ≤ 0.75: 1 - r. Default 10% → 0.9
    expect(runBlock(res("pyro"), ctx({ enemy_res_pyro: 0.1 }))).toBeCloseTo(0.9, 12);
    // r < 0 (vulnerability via shred): 1 - r/2. r = 0.1 - 0.4 = -0.3 → 1.15
    expect(runBlock(res("pyro"), ctx({ enemy_res_pyro: -0.3 }))).toBeCloseTo(1.15, 12);
    // r > 0.75: 1 / (1 + 4r). r = 0.9 → 1/4.6
    expect(runBlock(res("pyro"), ctx({ enemy_res_pyro: 0.9 }))).toBeCloseTo(1 / (1 + 4 * 0.9), 12);
    // boundary r = 0.75 uses linear branch → 0.25
    expect(runBlock(res("pyro"), ctx({ enemy_res_pyro: 0.75 }))).toBeCloseTo(0.25, 12);
  });

  it("cCritRate clamps to [0,1]; cCritDmg is (1 + Σ)", () => {
    expect(runBlock(cCritRate([cStat("crit_rate")]), ctx({ crit_rate: 1.5 }))).toBe(1);
    expect(runBlock(cCritRate([cStat("crit_rate")]), ctx({ crit_rate: -0.2 }))).toBe(0);
    expect(runBlock(cCritRate([cStat("crit_rate")]), ctx({ crit_rate: 0.6 }))).toBeCloseTo(0.6, 12);
    expect(runBlock(cCritDmg([cStat("crit_dmg")]), ctx({ crit_dmg: 0.5 }))).toBeCloseTo(1.5, 12);
  });

  it("cMultiplierReaction (the P1.6 seam) is (1 + Σ); empty → 1", () => {
    // Amplifying/transformative reaction bonuses sum, then (1 + Σ). Stand-in for
    // the EM-scaled reaction-DMG-bonus term P1.6 will compose here.
    const react = cMultiplierReaction([cStat("dmg_reaction_vaporize")]);
    expect(runBlock(react, ctx({ dmg_reaction_vaporize: 0.15 }))).toBeCloseTo(1.15, 12);
    expect(runBlock(cMultiplierReaction([]), ctx({}))).toBe(1);
  });
});

describe("CDamage.compile → the [normal, crit, avg] triple", () => {
  // Hu Tao N1-style controlled build (numbers chosen so the formula is hand-checkable):
  //   base    = 0.499824 (N1 talent% @ tl9, base-damage-and-scaling.md) × atk_total 1500 = 749.736
  //   bonus   = dmg_pyro 0.15 + dmg_normal 0.10 → 1.25
  //   defMult = lvl 90 vs lvl 90, no shred → 0.5
  //   resMult = 10% pyro res → 0.9
  //   normal  = 749.736 × 1.25 × 0.5 × 0.9 = 421.7295
  //   crit_dmg= 0.5 → crit = 421.7295 × 1.5 = 632.59425
  //   crit_rate=0.10 → avg = 421.7295 × (1 + 0.10×0.5) = 442.815975
  const EXPECTED_NORMAL = 749.736 * 1.25 * 0.5 * 0.9;
  const EXPECTED_CRIT = EXPECTED_NORMAL * 1.5;
  const EXPECTED_AVG = EXPECTED_NORMAL * (1 + 0.1 * 0.5);

  function huTaoN1Tree() {
    return cDamage({
      items: [
        cBaseDamage([cMulti([cConst(0.499824), cStat("atk_total")])]),
        cMultiplierBonus([cStat("dmg_pyro"), cStat("dmg_normal")]),
        cMultiplierDefence(),
        cMultiplierResistance("pyro"),
      ],
      critRate: cCritRate([cStat("crit_rate")]),
      critDmg: cCritDmg([cStat("crit_dmg")]),
    });
  }

  const build = ctx({
    atk_total: 1500,
    dmg_pyro: 0.15,
    dmg_normal: 0.1,
    crit_rate: 0.1,
    crit_dmg: 0.5,
    enemy_res_pyro: 0.1, // 10% pyro res → resMult 0.9
  });

  it("runBlock on CDamage produces the triple directly", () => {
    const r = runBlock(huTaoN1Tree(), build);
    // runBlock on a CDamage returns the avg scalar (its numeric reduction);
    // the full triple comes from compile(). Assert avg here.
    expect(r).toBeCloseTo(EXPECTED_AVG, 6);
  });

  it("compile() returns a fast closure producing the exact triple", () => {
    const fn = compile(huTaoN1Tree());
    const result = fn(build);
    expect(result.normal).toBeCloseTo(EXPECTED_NORMAL, 6);
    expect(result.crit).toBeCloseTo(EXPECTED_CRIT, 6);
    expect(result.avg).toBeCloseTo(EXPECTED_AVG, 6);
  });

  it("the avg identity holds: avg = normal·(1−cr) + crit·cr", () => {
    const fn = compile(huTaoN1Tree());
    const { normal, crit, avg } = fn(build);
    const cr = 0.1;
    expect(avg).toBeCloseTo(normal * (1 - cr) + crit * cr, 9);
  });

  it("clamps overcapped crit rate in the full pipeline (avg = crit when cr≥1)", () => {
    const fn = compile(huTaoN1Tree());
    const overcap = ctx({
      atk_total: 1500,
      dmg_pyro: 0.15,
      dmg_normal: 0.1,
      crit_rate: 1.4, // clamps to 1
      crit_dmg: 0.5,
    });
    const { crit, avg } = fn(overcap);
    expect(avg).toBeCloseTo(crit, 9);
  });

  it("compiled closure is reusable across contexts (pure, no shared state)", () => {
    const fn = compile(huTaoN1Tree());
    const a = fn(build);
    const b = fn(
      ctx({ atk_total: 3000, dmg_pyro: 0.15, dmg_normal: 0.1, crit_rate: 0.1, crit_dmg: 0.5, enemy_res_pyro: 0.1 })
    );
    // doubling atk_total doubles every component of the triple
    expect(b.normal).toBeCloseTo(a.normal * 2, 6);
    expect(b.crit).toBeCloseTo(a.crit * 2, 6);
    expect(b.avg).toBeCloseTo(a.avg * 2, 6);
    // re-running the first build still matches (no mutation leaked)
    expect(fn(build).normal).toBeCloseTo(EXPECTED_NORMAL, 6);
  });
});

describe("flat additive base terms (Shenhe/Yun Jin/Sara) and reaction seam", () => {
  it("cBaseDamage carries flat additive terms before the bonus factor", () => {
    // base = talent×atk + flat. 0.5×1000 + 200 = 700
    const base = cBaseDamage([cMulti([cConst(0.5), cStat("atk_total")]), cStat("flat_bonus")]);
    expect(runBlock(base, ctx({ atk_total: 1000, flat_bonus: 200 }))).toBeCloseTo(700, 9);
  });

  it("an extra multiplicative factor in items (the reaction seam) composes cleanly", () => {
    // Append a ×2 factor (stand-in for an amplifying-reaction multiplier P1.6 will supply).
    // normal becomes EXPECTED_NORMAL × 2 — proves a reaction block slots into items
    // without touching the crit/triple machinery.
    const tree = cDamage({
      items: [
        cBaseDamage([cMulti([cConst(0.499824), cStat("atk_total")])]),
        cMultiplierBonus([cStat("dmg_pyro"), cStat("dmg_normal")]),
        cMultiplierDefence(),
        cMultiplierResistance("pyro"),
        cConst(2), // ← reaction multiplier seam
      ],
      critRate: cCritRate([cStat("crit_rate")]),
      critDmg: cCritDmg([cStat("crit_dmg")]),
    });
    const fn = compile(tree);
    const { normal } = fn(
      ctx({ atk_total: 1500, dmg_pyro: 0.15, dmg_normal: 0.1, crit_rate: 0.1, crit_dmg: 0.5, enemy_res_pyro: 0.1 })
    );
    expect(normal).toBeCloseTo(749.736 * 1.25 * 0.5 * 0.9 * 2, 6);
  });

  it("CDamage with no crit blocks treats hit as non-crit (transformative path)", () => {
    // A reaction/transformative hit that cannot crit: critRate omitted → 0, crit == normal.
    const tree = cDamage({
      items: [cBaseDamage([cStat("flat_bonus")])],
    });
    const fn = compile(tree);
    const { normal, crit, avg } = fn(ctx({ flat_bonus: 500 }));
    expect(normal).toBe(500);
    expect(crit).toBe(500);
    expect(avg).toBe(500);
  });

  it("isDamageBlock discriminates the CDamage root from factor blocks", () => {
    expect(isDamageBlock(cDamage({ items: [cConst(1)] }))).toBe(true);
    expect(isDamageBlock(cBaseDamage([cConst(1)]))).toBe(false);
    expect(isDamageBlock(cMultiplierDefence())).toBe(false);
  });
});
