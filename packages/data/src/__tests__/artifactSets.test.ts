/**
 * P2.A0 — artifact-set shape + 2pc/4pc piece-count gating.
 *
 * Two layers:
 *   1. GATE UNIT TESTS — `buildStats({ setBonuses })` applies a set's bonus tiers
 *      under the piece-count gate: 2 pieces → only the 2pc tier; 4 pieces → 2pc + 4pc;
 *      < 2 → nothing. CrimsonWitch's 4pc stacks scale via `getStackCount` (the
 *      `set.crimson_witch_of_flames_4` setting). The condition gate stays distinct
 *      from the piece-count gate (a 4pc effect still needs its own toggle).
 *   2. END-TO-END FIXTURE MATCH — a character wearing each exemplar set, built on the
 *      FIXED canonical golden build (verbatim from golden.test.ts), compiled, and its
 *      signature damage features asserted against the P2.0 oracle fixtures
 *      (tests/golden/fixtures/set-{2pc,4pc}/<slug>.json) within abs tol 0.1:
 *        - Bennett  set-4pc (NoblesseOblige): burst +20% burst DMG (2pc) + party ATK
 *          +20% (4pc, global Buffs gate self-4pc OR team).
 *        - Diluc    set-2pc (CrimsonWitch):   pyro +15% (2pc only — proves the 4pc
 *          tier is gated OUT at 2 pieces).
 *        - Diluc    set-4pc (CrimsonWitch):   pyro +37.5% (2pc + 3 stacks) AND
 *          reaction DMG (overloaded/burgeon +40%; burning unaffected — her Burning
 *          reads dmg_reaction_bloom, not _burning).
 *        - Nahida   set-4pc (DeepwoodMemories): dendro +15% (2pc) + -30% dendro RES
 *          shred (4pc, global Buffs gate). Burning (pyro element) is unshredded.
 *   3. NO-SET NO-OP — buildStats with no `setBonuses` is byte-identical to an empty
 *      array, and equal to the un-set Diluc base (the set path is inert without sets).
 *
 * The oracle settings each fixture was generated under (tools/oracle/build-configs.mjs
 * `equipSet`): equipping N pieces injects `set_pieces.<key>` and toggles every NAMED
 * conditional to max — `set.noblesse_oblige_4: true`, `set.deepwood_memories_4: true`,
 * `set.crimson_witch_of_flames_4: 3` (stacks max). The `set_pieces.*` keys are injected
 * by buildStats from `setBonuses`; we pass the named toggles via `settings`.
 *
 * Sources:
 *   tests/golden/fixtures/set-2pc/diluc.json, set-4pc/{bennett,diluc,nahida}.json
 *   tools/oracle/build-configs.mjs (equipSet: which settings each fixture uses)
 *   packages/data/src/__tests__/golden.test.ts (STAT_BLOCK / LEVELS / ENEMY / TALENTS)
 */

import { describe, it, expect } from "vitest";
import { buildStats, type EquippedSet } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { bennett } from "../characters/bennett.js";
import { diluc } from "../characters/diluc.js";
import { nahida } from "../characters/nahida.js";
import {
  alleyFlashStatTable,
  theBellStatTable,
  solarPearlStatTable,
} from "../generated/weaponStatTables.js";
import type { DbObjectChar, EvalContext, StatTableEntry } from "@genshin/types";

// ---------------------------------------------------------------------------
// FIXED canonical build — verbatim from golden.test.ts (the standing regression build)
// ---------------------------------------------------------------------------

const STAT_BLOCK = {
  atk_base: 871,
  atk_percent: 18,
  crit_dmg_base: 50,
  crit_rate_base: 5,
  def_base: 876,
  dmg_burst: 64,
  dmg_charged: 16,
  dmg_electro: 2,
  dmg_normal: 8,
  dmg_phys: 4,
  dmg_skill: 32,
  hp_base: 13226,
  mastery_base: 55,
  recharge_base: 100,
} as const;

const LEVELS = { charLevel: 90, ascension: 6, weaponLevel: 90, weaponAscension: 6 } as const;
const ENEMY = { level: 90, resistance: 10 } as const;
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;
const TOLERANCE = 0.1;

// ---------------------------------------------------------------------------
// Harness — compile a character under a set + settings, assert features vs oracle
// ---------------------------------------------------------------------------

interface Triple {
  readonly normal: number;
  readonly crit: number;
  readonly average: number;
}

/** Compile every feature for a character built with the given sets + settings. */
function compileWithSets(
  char: DbObjectChar,
  weaponStatTable: readonly StatTableEntry[],
  setBonuses: readonly EquippedSet[],
  settings: EvalContext
): Readonly<Record<string, (ctx: ReturnType<typeof buildStats>["context"]) => Triple>> {
  const { context } = buildStats({
    char,
    weaponStatTable,
    statBlock: STAT_BLOCK,
    levels: LEVELS,
    enemy: ENEMY,
    settings,
    setBonuses,
  });
  const compiled = compileCharacter(char, {
    charElement: char.element,
    talentLevels: TALENTS,
    settings,
    charLevel: LEVELS.charLevel,
  });
  return Object.fromEntries(
    Object.entries(compiled).map(([k, fn]) => [
      k,
      (ctx: ReturnType<typeof buildStats>["context"]) => {
        const r = fn(ctx);
        return { normal: r.normal, crit: r.crit, average: r.avg };
      },
    ])
  ) as Readonly<Record<string, (ctx: ReturnType<typeof buildStats>["context"]) => Triple>>;
}

/** Assert a compiled feature's triple matches the oracle triple within tolerance. */
function expectFeature(
  char: DbObjectChar,
  weaponStatTable: readonly StatTableEntry[],
  setBonuses: readonly EquippedSet[],
  settings: EvalContext,
  key: string,
  oracle: Triple
): void {
  const { context } = buildStats({
    char,
    weaponStatTable,
    statBlock: STAT_BLOCK,
    levels: LEVELS,
    enemy: ENEMY,
    settings,
    setBonuses,
  });
  const compiled = compileCharacter(char, {
    charElement: char.element,
    talentLevels: TALENTS,
    settings,
    charLevel: LEVELS.charLevel,
  });
  const fn = compiled[key];
  expect(fn, `feature ${key} not produced`).toBeDefined();
  const r = fn!(context);
  expect(Math.abs(r.normal - oracle.normal), `${key} normal: ours=${r.normal}, oracle=${oracle.normal}`).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(r.crit - oracle.crit), `${key} crit: ours=${r.crit}, oracle=${oracle.crit}`).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(r.avg - oracle.average), `${key} avg: ours=${r.avg}, oracle=${oracle.average}`).toBeLessThanOrEqual(TOLERANCE);
}

// ---------------------------------------------------------------------------
// 1. Piece-count gate — unit behaviour through buildStats
// ---------------------------------------------------------------------------

describe("piece-count gate (CrimsonWitch dmg_pyro)", () => {
  // Diluc's skill is pyro; the emitted `dmg_pyro` fraction shows exactly the set's
  // pyro DMG contribution (base build supplies NO dmg_pyro), so the bag reads cleanly.
  function pyroBonus(setBonuses: readonly EquippedSet[], settings: EvalContext): number {
    const { stats } = buildStats({
      char: diluc,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
      setBonuses,
    });
    return stats["dmg_pyro"] ?? 0;
  }

  it("< 2 pieces → no bonus tier applies (set is a no-op)", () => {
    expect(pyroBonus([{ setKey: "CrimsonWitchOfFlames", pieces: 1 }], {})).toBe(0);
  });

  it("2 pieces → only the 2pc tier (+15% pyro)", () => {
    // 2pc dmg_pyro:15 → emitted fraction 0.15. The 4pc tier (stacks + reaction) is gated OUT.
    expect(pyroBonus([{ setKey: "CrimsonWitchOfFlames", pieces: 2 }], {})).toBeCloseTo(0.15, 10);
  });

  it("4 pieces, stacks toggle OFF → 2pc only (4pc stacks need their own gate)", () => {
    // Piece-count gate lets the 4pc tier IN, but the stacks condition's own gate
    // (set.crimson_witch_of_flames_4 > 0) is false → contributes nothing. Proves the
    // two gates are distinct: pieces>=4 alone does not fire the conditional 4pc stacks.
    expect(pyroBonus([{ setKey: "CrimsonWitchOfFlames", pieces: 4 }], {})).toBeCloseTo(0.15, 10);
  });

  it("4 pieces, 3 stacks → 2pc + 3×7.5% (+37.5% pyro) — stacks scale via getStackCount", () => {
    expect(
      pyroBonus([{ setKey: "CrimsonWitchOfFlames", pieces: 4 }], { "set.crimson_witch_of_flames_4": 3 })
    ).toBeCloseTo(0.375, 10);
  });

  it("4 pieces, 1 stack → 2pc + 1×7.5% (+22.5% pyro) — partial stack count", () => {
    expect(
      pyroBonus([{ setKey: "CrimsonWitchOfFlames", pieces: 4 }], { "set.crimson_witch_of_flames_4": 1 })
    ).toBeCloseTo(0.225, 10);
  });

  it("stacks clamp at maxStacks (5 requested → 3 applied → +37.5%)", () => {
    expect(
      pyroBonus([{ setKey: "CrimsonWitchOfFlames", pieces: 4 }], { "set.crimson_witch_of_flames_4": 5 })
    ).toBeCloseTo(0.375, 10);
  });

  it("unknown set key → no-op (set not yet ported)", () => {
    expect(pyroBonus([{ setKey: "NotAPortedSet", pieces: 4 }], {})).toBe(0);
  });
});

describe("piece-count gate (Noblesse 4pc ATK needs pieces>=4 AND toggle)", () => {
  function atkTotal(setBonuses: readonly EquippedSet[], settings: EvalContext): number {
    const { stats } = buildStats({
      char: bennett,
      weaponStatTable: alleyFlashStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
      setBonuses,
    });
    return stats["atk_total"]!;
  }

  const baseAtk = atkTotal([], {});

  it("2 pieces + toggle ON → no ATK buff (pieces-count gate fails at 2)", () => {
    expect(atkTotal([{ setKey: "NoblesseOblige", pieces: 2 }], { "set.noblesse_oblige_4": true })).toBeCloseTo(baseAtk, 6);
  });

  it("4 pieces, toggle OFF → no ATK buff (condition gate fails)", () => {
    expect(atkTotal([{ setKey: "NoblesseOblige", pieces: 4 }], {})).toBeCloseTo(baseAtk, 6);
  });

  it("4 pieces + toggle ON → +20% ATK (additive in the percent bucket: 1.38/1.18 over base)", () => {
    const buffed = atkTotal([{ setKey: "NoblesseOblige", pieces: 4 }], { "set.noblesse_oblige_4": true });
    expect(buffed / baseAtk).toBeCloseTo(1.38 / 1.18, 6);
  });

  // NOTE: the `set_other.noblesse_oblige_4` TEAMMATE path (a buff a teammate's
  // Noblesse grants when YOU wear no pieces) is intentionally OUT OF SCOPE for P2.A0.
  // `setBonuses` models the character's OWN equipped sets, so the buff condition only
  // enters the loop when the wearer has the 4pc. The teammate branch of the OR gate is
  // modelled (so the data is faithful) but only fires through self-equipment here; a
  // future party/buffs input (her global DbObjectBuff channel) would surface it
  // independent of self-equipment. No P2.0 fixture exercises the teammate path.
});

// ---------------------------------------------------------------------------
// 2. End-to-end fixture matches (the P2.A0 acceptance gate)
// ---------------------------------------------------------------------------

describe("Bennett set-4pc (NoblesseOblige) vs oracle", () => {
  const sets: EquippedSet[] = [{ setKey: "NoblesseOblige", pieces: 4 }];
  const settings: EvalContext = { "set.noblesse_oblige_4": true };

  it("burst.burst_dmg — +20% burst DMG (2pc) + +20% ATK (4pc)", () => {
    expectFeature(bennett, alleyFlashStatTable, sets, settings, "burst.burst_dmg", {
      normal: 8054.527458873996,
      crit: 16109.054917747992,
      average: 8859.980204761396,
    });
  });

  it("skill.press_dmg — +20% ATK only (4pc; 2pc burst DMG does not touch skill)", () => {
    expectFeature(bennett, alleyFlashStatTable, sets, settings, "skill.press_dmg", {
      normal: 3415.3218180613176,
      crit: 6830.643636122635,
      average: 3756.8539998674496,
    });
  });

  it("attack.normal_hit_1 — +20% ATK only", () => {
    expectFeature(bennett, alleyFlashStatTable, sets, settings, "attack.normal_hit_1", {
      normal: 1030.2994455648336,
      crit: 2060.598891129667,
      average: 1133.329390121317,
    });
  });
});

describe("Diluc set-2pc (CrimsonWitch) vs oracle — 2pc only, no 4pc", () => {
  const sets: EquippedSet[] = [{ setKey: "CrimsonWitchOfFlames", pieces: 2 }];
  const settings: EvalContext = {}; // CW 2pc is a static (unconditional) bonus

  it("skill.skill_hit_1 — +15% pyro (2pc)", () => {
    expectFeature(diluc, theBellStatTable, sets, settings, "skill.skill_hit_1", {
      normal: 2275.2853094950456,
      crit: 4550.570618990091,
      average: 2939.668619867599,
    });
  });

  it("attack.normal_hit_1 — +15% pyro (2pc)", () => {
    expectFeature(diluc, theBellStatTable, sets, settings, "attack.normal_hit_1", {
      normal: 1808.9446606876809,
      crit: 3617.8893213753618,
      average: 2337.1565016084833,
    });
  });

  it("burst.diluc_burst_explosion — +15% pyro (2pc)", () => {
    expectFeature(diluc, theBellStatTable, sets, settings, "burst.diluc_burst_explosion", {
      normal: 5987.282252502096,
      crit: 11974.564505004191,
      average: 7735.5686702327075,
    });
  });
});

describe("Diluc set-4pc (CrimsonWitch) vs oracle — 2pc + 3 stacks + reaction DMG", () => {
  const sets: EquippedSet[] = [{ setKey: "CrimsonWitchOfFlames", pieces: 4 }];
  const settings: EvalContext = { "set.crimson_witch_of_flames_4": 3 };

  it("skill.skill_hit_1 — +37.5% pyro (2pc +15 + 3 stacks ×7.5)", () => {
    expectFeature(diluc, theBellStatTable, sets, settings, "skill.skill_hit_1", {
      normal: 2623.5432650300013,
      crit: 5247.086530060003,
      average: 3389.6178984187613,
    });
  });

  it("reaction.overloaded — +40% overloaded reaction DMG (4pc)", () => {
    expectFeature(diluc, theBellStatTable, sets, settings, "reaction.overloaded", {
      normal: 6546.800868010948,
      crit: 6546.800868010948,
      average: 6546.800868010948,
    });
  });

  it("reaction.burgeon — +40% burgeon reaction DMG (4pc dmg_reaction_burgeon)", () => {
    expectFeature(diluc, theBellStatTable, sets, settings, "reaction.burgeon", {
      normal: 7141.964583284671,
      crit: 7141.964583284671,
      average: 7141.964583284671,
    });
  });

  it("reaction.burning — UNCHANGED (her Burning reads dmg_reaction_bloom, not _burning)", () => {
    expectFeature(diluc, theBellStatTable, sets, settings, "reaction.burning", {
      normal: 464.9469002737226,
      crit: 464.9469002737226,
      average: 464.9469002737226,
    });
  });
});

describe("Nahida set-4pc (DeepwoodMemories) vs oracle — 2pc dendro + 4pc RES shred", () => {
  const sets: EquippedSet[] = [{ setKey: "DeepwoodMemories", pieces: 4 }];
  const settings: EvalContext = { "set.deepwood_memories_4": true };

  it("skill.press_dmg — +15% dendro (2pc) × -30% dendro RES shred (4pc)", () => {
    expectFeature(nahida, solarPearlStatTable, sets, settings, "skill.press_dmg", {
      normal: 2838.1153230569244,
      crit: 5676.230646113849,
      average: 3904.2249630100273,
    });
  });

  it("attack.normal_hit_1 — +15% dendro (2pc) × RES shred (4pc)", () => {
    expectFeature(nahida, solarPearlStatTable, sets, settings, "attack.normal_hit_1", {
      normal: 972.7007432271711,
      crit: 1945.4014864543421,
      average: 1338.0860504130255,
    });
  });

  it("reaction.rupture — RES shred only (dendro reaction; ×1.10/0.90)", () => {
    expectFeature(nahida, solarPearlStatTable, sets, settings, "reaction.rupture", {
      normal: 7177.2520584185795,
      crit: 7177.2520584185795,
      average: 7177.2520584185795,
    });
  });
});

// ---------------------------------------------------------------------------
// 3. No-set no-op — the set path is inert without sets
// ---------------------------------------------------------------------------

describe("no-set no-op", () => {
  function dilucStats(setBonuses?: readonly EquippedSet[]) {
    return buildStats({
      char: diluc,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
      ...(setBonuses ? { setBonuses } : {}),
    }).stats;
  }

  it("omitting setBonuses == passing an empty array (byte-identical bag)", () => {
    expect(dilucStats(undefined)).toEqual(dilucStats([]));
  });

  it("no set contributes no dmg_pyro / no set_pieces leakage / unchanged ATK", () => {
    const stats = dilucStats(undefined);
    expect(stats["dmg_pyro"]).toBeUndefined();
    // no set_pieces.* key leaks into the engine-facing bag
    expect(Object.keys(stats).some((k) => k.startsWith("set_pieces."))).toBe(false);
  });

  it("Diluc base skill matches the un-set oracle base (no set drift)", () => {
    // Base diluc.json skill.skill_hit_1.normal = 2043.1133391384083 (no sets).
    expectFeature(diluc, theBellStatTable, [], {}, "skill.skill_hit_1", {
      normal: 2043.1133391384083,
      crit: 4086.2266782768165,
      average: 2639.702434166823,
    });
  });
});
