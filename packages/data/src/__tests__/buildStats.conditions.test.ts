/**
 * buildStats — conditional-layer wiring (P2.2, the keystone).
 *
 * Asserts the additive condition-application loop in buildStats: for every
 * active condition on `char.conditions` (plus the generic `extraConditions`
 * channel for weapon/set conditions), its contributed `.stats` are concatenated
 * into the raw stat bag — RAW percents, before applyPostEffects, exactly as her
 * CalcSet.getBaseStats orders it.
 *
 * Three layers of assertion:
 *   1. char.conditions stat contribution (synthetic boolean-with-stats).
 *   2. extraConditions channel (a refine condition driven by weapon_refine).
 *   3. Hu Tao end-to-end vs the P2.0 oracle fixtures: paramita ON matches
 *      tests/golden/fixtures/toggles/hu_tao.json, OFF matches the base fixture.
 *      (Hu Tao's paramita has no .stats, so the loop is a no-op for him; his
 *      ON/OFF delta flows through the already-wired hpToAtk post-effect — this
 *      proves the loop does not regress that path.)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/CalcSet.js (getBaseStats loop)
 *   tests/golden/fixtures/toggles/hu_tao.json (paramita-ON oracle)
 *   tests/golden/fixtures/hu_tao.json (base oracle)
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { buildSettings } from "../buildSettings.js";
import { compileCharacter } from "../loader.js";
import { huTao } from "../characters/hu-tao.js";
import { blackcliffPoleStatTable } from "../generated/weaponStatTables.js";
import type {
  Condition,
  ConditionBoolean,
  ConditionStaticRefine,
  DbObjectChar,
  StatTableEntry,
} from "@genshin/types";

// ---------------------------------------------------------------------------
// FIXED canonical build (verbatim from tests/golden/fixtures/_manifest.json)
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

const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

const ENEMY = { level: 90, resistance: 10 } as const;
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

// ---------------------------------------------------------------------------
// 1-2. Loop wiring with synthetic conditions (isolate the stat contribution)
// ---------------------------------------------------------------------------

/** A minimal char carrying only the given conditions (no features/post-effects). */
function charWithConditions(conditions: readonly Condition[]): DbObjectChar {
  return { ...huTao, postEffects: [], conditions };
}

function buildWith(
  conditions: readonly Condition[],
  settings: Record<string, unknown>,
  extraConditions: readonly Condition[] = []
) {
  return buildStats({
    char: charWithConditions(conditions),
    weaponStatTable: blackcliffPoleStatTable,
    statBlock: STAT_BLOCK,
    levels: LEVELS,
    enemy: ENEMY,
    settings,
    extraConditions,
  });
}

describe("buildStats — char.conditions stat contribution", () => {
  const boost: ConditionBoolean = {
    type: "boolean",
    name: "synthetic_boost",
    stats: { atk_percent: 20 },
  };

  it("an inactive condition contributes nothing (loop is a no-op)", () => {
    const { stats } = buildWith([boost], {});
    // Base atk_total = char+weapon+bonus base × (1 + 18%) — the established baseline.
    expect(stats.atk_total).toBeCloseTo(1754.7075883379998, 3);
  });

  it("an active boolean condition concats its RAW percent into the bag", () => {
    const { stats } = buildWith([boost], { synthetic_boost: true });
    // atk_percent goes from 18 → 38; getTotal re-applies base × (1 + %/100).
    // Δ = atk_base_total × 0.20, where atk_base_total is char+weapon+bonus atk_base.
    const baseAtkTotalAt18 = 1754.7075883379998;
    // Recompute the expected: total at 38% vs 18% differs by atk_base × 0.20.
    // atk_base (char+weapon+bonus): from baseline, base×1.18 = 1754.70758834 → base = 1487.0403...
    const atkBase = baseAtkTotalAt18 / 1.18;
    expect(stats.atk_total).toBeCloseTo(atkBase * 1.38, 3);
  });
});

describe("buildStats — extraConditions channel (weapon/set conditions)", () => {
  // Wolf's-Gravestone-style always-on refine passive, passed via extraConditions.
  const refinePassive: ConditionStaticRefine = {
    type: "refine",
    refinementStats: [
      { atk_percent: 20 }, // R1
      { atk_percent: 25 }, // R2
      { atk_percent: 30 }, // R3
      { atk_percent: 35 }, // R4
      { atk_percent: 40 }, // R5
    ],
  };

  it("resolves the refine bag by weapon_refine and concats it (R3 → +30% ATK)", () => {
    const { stats } = buildWith([], buildSettings({ weaponRefine: 3 }), [refinePassive]);
    const atkBase = 1754.7075883379998 / 1.18; // char+weapon+bonus atk_base
    // atk_percent 18 + 30 = 48.
    expect(stats.atk_total).toBeCloseTo(atkBase * 1.48, 3);
  });

  it("absent weapon_refine → refine condition contributes nothing", () => {
    const { stats } = buildWith([], {}, [refinePassive]);
    expect(stats.atk_total).toBeCloseTo(1754.7075883379998, 3);
  });
});

// ---------------------------------------------------------------------------
// 3. Hu Tao end-to-end vs the P2.0 oracle fixtures
// ---------------------------------------------------------------------------

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures"
);

interface FixtureEntry {
  readonly category: string;
  readonly damageType: string | undefined;
  readonly normal: number;
  readonly crit: number;
  readonly average: number;
}
interface Fixture {
  readonly features: Record<string, FixtureEntry>;
}

function loadFixture(relPath: string): Fixture {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, relPath), "utf-8")) as Fixture;
}

const TOLERANCE = 0.1;

function isDamageTriple(entry: FixtureEntry): boolean {
  return entry.category !== "stats" && Boolean(entry.damageType);
}

/** Compile Hu Tao under `settings` and assert every produced feature matches `fixture`. */
function assertHuTaoMatches(settings: Record<string, unknown>, fixture: Fixture): void {
  const { context } = buildStats({
    char: huTao,
    weaponStatTable: blackcliffPoleStatTable as readonly StatTableEntry[],
    statBlock: STAT_BLOCK,
    levels: LEVELS,
    enemy: ENEMY,
    settings,
  });
  const compiled = compileCharacter(huTao, {
    charElement: huTao.element,
    talentLevels: TALENTS,
    settings,
    charLevel: LEVELS.charLevel,
  });

  const producedKeys = Object.keys(compiled).filter(
    (k) => k in fixture.features && isDamageTriple(fixture.features[k]!)
  );
  expect(producedKeys.length).toBeGreaterThan(0);

  for (const key of producedKeys) {
    const oracle = fixture.features[key]!;
    const result = compiled[key]!(context);
    expect(
      Math.abs(result.normal - oracle.normal),
      `${key} normal: ours=${result.normal.toFixed(4)} oracle=${oracle.normal.toFixed(4)}`
    ).toBeLessThanOrEqual(TOLERANCE);
    expect(
      Math.abs(result.crit - oracle.crit),
      `${key} crit: ours=${result.crit.toFixed(4)} oracle=${oracle.crit.toFixed(4)}`
    ).toBeLessThanOrEqual(TOLERANCE);
    expect(
      Math.abs(result.avg - oracle.average),
      `${key} avg: ours=${result.avg.toFixed(4)} oracle=${oracle.average.toFixed(4)}`
    ).toBeLessThanOrEqual(TOLERANCE);
  }
}

describe("buildStats — Hu Tao paramita end-to-end vs oracle fixtures", () => {
  // The P2.0 toggle fixture encodes Hu Tao's FULL Paramita state. In her source
  // (raw/.../db/Char/Hutao.js:380-388) the Paramita ConditionBoolean carries
  // `settings: { attack_infusion: 'pyro' }`, which her CalcSet.getBaseStats
  // propagates (condData.settings) — so the oracle's normal/charged hits read
  // `dmg_pyro`, not `dmg_phys`. Our port's `paramita` condition is the stripped
  // gate `{ type:"boolean", name:"hutao_paramita_papilio" }` (no settings/stats);
  // enriching it with the infusion setting + A4 dmg_pyro is P2.C's character-
  // content job, NOT this keystone's. So here we drive the EQUIVALENT context the
  // oracle used — the toggle plus the pyro infusion it activates — to validate the
  // loop integrates without regression. (The A4 dmg_pyro is already baked into
  // Hu Tao's canonical build via baseStats, which is why his always-pyro skill /
  // burst match at Δ=0 even at base.) With this context, every produced feature
  // matches the toggle oracle to Δ=0.
  it("paramita ON (with the pyro infusion it activates) matches the toggle-ON oracle", () => {
    assertHuTaoMatches(
      buildSettings({ toggles: { hutao_paramita_papilio: true }, infusion: "pyro" }),
      loadFixture("toggles/hu_tao.json")
    );
  });

  it("paramita OFF matches the base oracle (hu_tao.json) — no regression", () => {
    assertHuTaoMatches(buildSettings({}), loadFixture("hu_tao.json"));
  });
});
