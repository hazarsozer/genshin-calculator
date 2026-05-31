/**
 * conditionStats resolver tests — TDD per task P2.2.
 *
 * conditionStats(cond, ctx) resolves the RAW stat bag a condition contributes
 * when active under ctx (inactive → {}). It is the per-condition half of the
 * loop her CalcSet.getBaseStats runs (cond.getData(settings).stats), modernised:
 *
 *   - inactive (evaluate → false)          → {}
 *   - active boolean/static/constellation/
 *     number/and/or                        → cond.stats
 *   - stacks                               → getStackCount × per-stack bag
 *                                            (refinementStats[refine-1] ?? cond.stats)
 *   - refine / boolean-refine              → refinementStats[weapon_refine-1]
 *                                            (+ non-refine cond.stats), refine 1-indexed;
 *                                            absent/0 refine → no refine bag (her
 *                                            StatTable.getValue(level<=0) === 0)
 *
 * Percent stats stay RAW (e.g. atk_percent: 20) — the emit-time /100 in buildStats
 * converts them; the resolver never pre-divides.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/CalcSet.js (getBaseStats loop)
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js (getStats via getValue(weapon_refine))
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks.js (getStats × stacksCnt)
 *   raw/genshin_calc_pub/src/js/classes/StatTable.js (getValue(level<=0) === 0)
 */

import { describe, expect, it } from "vitest";
import { conditionStats, type EvalContext } from "../index.js";
import type {
  ConditionBoolean,
  ConditionStatic,
  ConditionConstellation,
  ConditionNumber,
  ConditionStacks,
  ConditionStaticRefine,
  ConditionBooleanRefine,
  ConditionAnd,
  ConditionOr,
} from "@genshin/types";

const emptyCtx: EvalContext = {};

// ---------------------------------------------------------------------------
// boolean / static / constellation / number — plain cond.stats when active
// ---------------------------------------------------------------------------

describe("conditionStats — non-refine variants emit cond.stats when active", () => {
  it("boolean: {} when inactive, cond.stats when toggled on", () => {
    const c: ConditionBoolean = {
      type: "boolean",
      name: "tog",
      stats: { atk_percent: 20, crit_rate: 10 },
    };
    expect(conditionStats(c, emptyCtx)).toEqual({});
    expect(conditionStats(c, { tog: true })).toEqual({ atk_percent: 20, crit_rate: 10 });
  });

  it("boolean active but no stats → {}", () => {
    const c: ConditionBoolean = { type: "boolean", name: "tog" };
    expect(conditionStats(c, { tog: true })).toEqual({});
  });

  it("static: always-on cond.stats (gate permitting)", () => {
    const c: ConditionStatic = { type: "static", stats: { dmg_pyro: 15 } };
    expect(conditionStats(c, emptyCtx)).toEqual({ dmg_pyro: 15 });
  });

  it("constellation: {} below threshold, cond.stats at/above", () => {
    const c: ConditionConstellation = {
      type: "constellation",
      constellation: 4,
      stats: { crit_dmg: 30 },
    };
    expect(conditionStats(c, { char_constellation: 3 })).toEqual({});
    expect(conditionStats(c, { char_constellation: 4 })).toEqual({ crit_dmg: 30 });
  });

  it("number: {} when 0/absent, cond.stats when > 0", () => {
    const c: ConditionNumber = { type: "number", name: "n", stats: { mastery: 50 } };
    expect(conditionStats(c, { n: 0 })).toEqual({});
    expect(conditionStats(c, { n: 5 })).toEqual({ mastery: 50 });
  });

  it("and/or: cond-less containers contribute nothing (no stats field)", () => {
    const a: ConditionAnd = { type: "and", items: [] };
    const o: ConditionOr = { type: "or", items: [] };
    expect(conditionStats(a, emptyCtx)).toEqual({});
    expect(conditionStats(o, emptyCtx)).toEqual({}); // empty or → inactive
    // active or (one vacuously-true `and` child) reaches the explicit `case "or"` → still {}
    const activeOr: ConditionOr = { type: "or", items: [{ type: "and", items: [] }] };
    expect(conditionStats(activeOr, emptyCtx)).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// stacks — getStackCount × per-stack bag
// ---------------------------------------------------------------------------

describe("conditionStats — stacks scale the per-stack bag by stack count", () => {
  it("scales cond.stats by the clamped stack count", () => {
    const c: ConditionStacks = {
      type: "stacks",
      name: "s",
      maxStacks: 4,
      stats: { atk_percent: 5 }, // per-stack
    };
    expect(conditionStats(c, { s: 0 })).toEqual({});
    expect(conditionStats(c, { s: 3 })).toEqual({ atk_percent: 15 });
    // clamps to maxStacks
    expect(conditionStats(c, { s: 99 })).toEqual({ atk_percent: 20 });
  });

  it("uses the refine-indexed per-stack bag when refinementStats present", () => {
    // Lost-Prayer-style: per-stack EM scales with weapon refine.
    const c: ConditionStacks = {
      type: "stacks",
      name: "s",
      maxStacks: 4,
      refinementStats: [
        { dmg_anemo: 8 }, // R1 per-stack
        { dmg_anemo: 10 }, // R2
        { dmg_anemo: 12 }, // R3
        { dmg_anemo: 14 }, // R4
        { dmg_anemo: 16 }, // R5
      ],
    };
    // R3, 4 stacks → 12 × 4
    expect(conditionStats(c, { s: 4, weapon_refine: 3 })).toEqual({ dmg_anemo: 48 });
    // R1, 2 stacks → 8 × 2
    expect(conditionStats(c, { s: 2, weapon_refine: 1 })).toEqual({ dmg_anemo: 16 });
  });
});

// ---------------------------------------------------------------------------
// refine / boolean-refine — refinementStats[weapon_refine - 1]
// ---------------------------------------------------------------------------

describe("conditionStats — refine variants resolve by weapon_refine (1-indexed)", () => {
  const refineStats = [
    { atk_percent: 20 }, // R1
    { atk_percent: 25 }, // R2
    { atk_percent: 30 }, // R3
    { atk_percent: 35 }, // R4
    { atk_percent: 40 }, // R5
  ];

  it("static refine: picks the weapon_refine-indexed bag", () => {
    const c: ConditionStaticRefine = { type: "refine", refinementStats: refineStats };
    expect(conditionStats(c, { weapon_refine: 1 })).toEqual({ atk_percent: 20 });
    expect(conditionStats(c, { weapon_refine: 5 })).toEqual({ atk_percent: 40 });
  });

  it("static refine: absent/0 weapon_refine contributes nothing (her getValue(level<=0)===0)", () => {
    const c: ConditionStaticRefine = { type: "refine", refinementStats: refineStats };
    expect(conditionStats(c, emptyCtx)).toEqual({});
    expect(conditionStats(c, { weapon_refine: 0 })).toEqual({});
  });

  it("boolean-refine: {} when toggle off, refine bag when on", () => {
    const c: ConditionBooleanRefine = {
      type: "boolean-refine",
      name: "wg",
      refinementStats: refineStats,
    };
    expect(conditionStats(c, { weapon_refine: 3 })).toEqual({}); // toggle off
    expect(conditionStats(c, { wg: true, weapon_refine: 3 })).toEqual({ atk_percent: 30 });
  });

  it("static refine: folds non-refine cond.stats with the refine bag", () => {
    const c: ConditionStaticRefine = {
      type: "refine",
      stats: { crit_rate: 5 }, // not refine-scaled
      refinementStats: refineStats,
    };
    expect(conditionStats(c, { weapon_refine: 2 })).toEqual({ atk_percent: 25, crit_rate: 5 });
  });
});
