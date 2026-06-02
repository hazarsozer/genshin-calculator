/**
 * conditionStats resolver tests — TDD per task P2.2.
 *
 * conditionStats(cond, ctx) resolves the RAW stat bag a condition contributes
 * when active under ctx (inactive → {}). It is the per-condition half of the
 * loop her CalcSet.getBaseStats runs (cond.getData(settings).stats), modernised:
 *
 *   - inactive (evaluate → false)          → {}
 *   - active boolean/static/constellation/
 *     and/or                               → cond.stats
 *   - number                               → cond.stats + the clamped value emitted
 *                                            as a stat keyed by `name` (her
 *                                            ConditionNumber.getStats: super.getStats()
 *                                            + stats.add(name, getValue))
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
import { conditionStats, evaluate, type EvalContext } from "../index.js";
import type {
  ConditionBoolean,
  ConditionStatic,
  ConditionConstellation,
  ConditionNumber,
  ConditionStacks,
  ConditionStaticLevel,
  ConditionStaticRefine,
  ConditionBooleanRefine,
  ConditionAnd,
  ConditionOr,
  ConditionBooleanPiecesCount,
  ConditionBooleanWeaponType,
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

  it("number: {} when 0/absent; cond.stats + emitted value when > 0", () => {
    const c: ConditionNumber = { type: "number", name: "n", stats: { mastery: 50 } };
    expect(conditionStats(c, { n: 0 })).toEqual({});
    // Active: cond.stats PLUS the clamped numeric value emitted as a stat keyed by
    // `name` — her ConditionNumber.getStats does super.getStats() + stats.add(name, getValue).
    expect(conditionStats(c, { n: 5 })).toEqual({ mastery: 50, n: 5 });
  });

  it("number: emitted value is clamped to [min, max] (party_max_mastery pattern)", () => {
    const capped: ConditionNumber = { type: "number", name: "party_max_mastery", max: 1000 };
    expect(conditionStats(capped, { party_max_mastery: 2000 })).toEqual({ party_max_mastery: 1000 });
    expect(conditionStats(capped, { party_max_mastery: 600 })).toEqual({ party_max_mastery: 600 });
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

  it("weapon-type: pure gate — {} whether active or not (no stats field)", () => {
    const c: ConditionBooleanWeaponType = {
      type: "weapon-type",
      types: ["sword", "claymore", "polearm"],
    };
    // inactive (bow)
    expect(conditionStats(c, { weapon_type: "bow" })).toEqual({});
    // active (claymore) — still {} because it is a gate-only variant
    expect(conditionStats(c, { weapon_type: "claymore" })).toEqual({});
  });

  it("pieces-count: pure gate — {} whether active or not", () => {
    // Active when set_pieces.<setname-lowercased> >= count; like and/or it carries
    // no stats of its own, so conditionStats returns {} even when active.
    const c: ConditionBooleanPiecesCount = {
      type: "pieces-count",
      setName: "NoblesseOblige",
      count: 4,
    };
    expect(conditionStats(c, { "set_pieces.noblesseoblige": 2 })).toEqual({}); // < count
    expect(conditionStats(c, { "set_pieces.noblesseoblige": 4 })).toEqual({}); // >= count, still {}
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

// ---------------------------------------------------------------------------
// staticLevel — level-indexed stat tables (ConditionStaticLevel)
// ---------------------------------------------------------------------------

describe("conditionStats — staticLevel resolves level-indexed stat tables", () => {
  // GildedDreams 4pc same-element table: [0, 14, 28, 42] with fromZero: true
  // ctx.party_elements_same = N → level = N+1 → atk_percent[N] (0-based, so index N)
  const samePath: ConditionStaticLevel = {
    type: "staticLevel",
    levelSetting: "party_elements_same",
    fromZero: true,
    levelStats: { atk_percent: [0, 14, 28, 42] },
  };

  it("fromZero: level 0 ctx value → level 1 → arr[0] = 0 → {} (zero omitted)", () => {
    expect(conditionStats(samePath, {})).toEqual({});
    expect(conditionStats(samePath, { party_elements_same: 0 })).toEqual({});
  });

  it("fromZero: ctx=1 → level 2 → arr[1] = 14", () => {
    expect(conditionStats(samePath, { party_elements_same: 1 })).toEqual({ atk_percent: 14 });
  });

  it("fromZero: ctx=2 → level 3 → arr[2] = 28", () => {
    expect(conditionStats(samePath, { party_elements_same: 2 })).toEqual({ atk_percent: 28 });
  });

  it("fromZero: ctx=3 → level 4 → arr[3] = 42", () => {
    expect(conditionStats(samePath, { party_elements_same: 3 })).toEqual({ atk_percent: 42 });
  });

  it("StatTable.getValue clamp: level beyond length clamps to last value", () => {
    // ctx=99 → level 100 → clamps to arr[3] = 42
    expect(conditionStats(samePath, { party_elements_same: 99 })).toEqual({ atk_percent: 42 });
  });

  it("GildedDreams diff-element table: [0, 50, 100, 150] with fromZero", () => {
    const diffPath: ConditionStaticLevel = {
      type: "staticLevel",
      levelSetting: "party_elements_different",
      fromZero: true,
      levelStats: { mastery: [0, 50, 100, 150] },
    };
    expect(conditionStats(diffPath, {})).toEqual({});
    expect(conditionStats(diffPath, { party_elements_different: 1 })).toEqual({ mastery: 50 });
    expect(conditionStats(diffPath, { party_elements_different: 3 })).toEqual({ mastery: 150 });
  });

  it("gated (condition): inactive when gate fails, active when gate passes", () => {
    const gated: ConditionStaticLevel = {
      type: "staticLevel",
      levelSetting: "party_elements_same",
      fromZero: true,
      levelStats: { atk_percent: [0, 14, 28, 42] },
      condition: { type: "boolean", name: "set.gilded_dreams_4" },
    };
    // Gate fails → inactive → {}
    expect(conditionStats(gated, { party_elements_same: 2 })).toEqual({});
    // Gate passes and level resolves → stats
    expect(conditionStats(gated, { "set.gilded_dreams_4": true, party_elements_same: 2 })).toEqual({ atk_percent: 28 });
  });
});

describe("conditionStats — staticLevel fromZero:false and _bonus accumulation", () => {
  it("fromZero:false — absent/0 ctx falls through to level 1 (her level ||= 1 path)", () => {
    // Level.js:13: level ||= 1 when !fromZero → 0 becomes 1 → arr[0]
    const c: ConditionStaticLevel = {
      type: "staticLevel",
      levelSetting: "some_level",
      fromZero: false,
      levelStats: { atk_percent: [10, 20, 30] },
    };
    // absent key: raw=0, bonus=0 → level = 0||1 = 1 → arr[0] = 10
    expect(conditionStats(c, {})).toEqual({ atk_percent: 10 });
    expect(conditionStats(c, { some_level: 0 })).toEqual({ atk_percent: 10 });
    // explicit value 2: raw=2 → level = 2||1 = 2 → arr[1] = 20
    expect(conditionStats(c, { some_level: 2 })).toEqual({ atk_percent: 20 });
  });

  it("_bonus accumulation: ctx[levelSetting_bonus] and _bonus_2 added before fromZero (Level.js:7-8)", () => {
    // Level.js: raw += bonus || 0; raw += bonus_2 || 0; then fromZero → ++raw → level
    // With fromZero: true, levelSetting=x, stats=[0,14,28,42]:
    //   ctx = { x: 0, x_bonus: 1, x_bonus_2: 1 } → raw=0+1+1=2, level=2+1=3 → arr[2]=28
    const c: ConditionStaticLevel = {
      type: "staticLevel",
      levelSetting: "party_elements_same",
      fromZero: true,
      levelStats: { atk_percent: [0, 14, 28, 42] },
    };
    // base=0, bonus=1, bonus_2=1 → raw=2, level=3 → arr[2]=28
    expect(
      conditionStats(c, { party_elements_same: 0, party_elements_same_bonus: 1, party_elements_same_bonus_2: 1 })
    ).toEqual({ atk_percent: 28 });
    // base=1, bonus=1 (no _bonus_2) → raw=2, level=3 → arr[2]=28
    expect(
      conditionStats(c, { party_elements_same: 1, party_elements_same_bonus: 1 })
    ).toEqual({ atk_percent: 28 });
  });
});

describe("evaluate — staticLevel activation semantics", () => {
  const c: ConditionStaticLevel = {
    type: "staticLevel",
    levelSetting: "party_elements_same",
    fromZero: true,
    levelStats: { atk_percent: [0, 14, 28, 42] },
  };

  it("active (no gate) regardless of ctx value — static semantics", () => {
    expect(evaluate(c, {})).toBe(true);
    expect(evaluate(c, { party_elements_same: 0 })).toBe(true);
    expect(evaluate(c, { party_elements_same: 2 })).toBe(true);
  });

  it("inactive when gate condition fails", () => {
    const gated: ConditionStaticLevel = {
      ...c,
      condition: { type: "boolean", name: "set.gilded_dreams_4" },
    };
    expect(evaluate(gated, { party_elements_same: 2 })).toBe(false);
    expect(evaluate(gated, { "set.gilded_dreams_4": true, party_elements_same: 2 })).toBe(true);
  });
});
