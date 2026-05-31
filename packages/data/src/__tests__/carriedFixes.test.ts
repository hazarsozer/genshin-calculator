/**
 * P2.4 — Carried engine fixes: Furina A4 (`damageBonusesRaw`) + HP→ATK cap base.
 *
 * Both bugs are LATENT at the fixed canonical (`base`) build and BIND only on a
 * varied build — that's exactly why P2.0 dumped the `stat-variance` config. So
 * every fix here is asserted on BOTH builds: `base` (regression — must stay green)
 * AND a varied-HP / high-ATK build (the build that exposes the bug).
 *
 * FIX 1 — Furina A4 "Unheard Confession" (`dmg_skill_furina`).
 *   Her raw models it as a PostEffectStatsHP writing the PERCENT stat
 *   `dmg_skill_furina = min(0.0007 × hp_total, 28)` (Furina.js:503-509). Because
 *   `isPercent('dmg_skill_furina')` is true, her `PostEffectStats.getTree` folds
 *   the `isPercent /100` INSIDE the post-effect (Stats.js:63-66) → the value lands
 *   in the bag as a FRACTION. The engine reads that fraction directly.
 *     base build:          hp_total 28533.38835 → min(19.973, 28) = 19.973% → 0.19973371845
 *     stat-variance build: hp_total 66420.63    → min(46.49, 28) = 28%     → 0.28 (cap binds)
 *   The OLD hardcode folded the *fixed build's* 0.19973371845 as a static baseStats
 *   percent — correct at `base`, but it emits 0.19973 on stat-variance where the
 *   real value is 0.28. That desync is the bug this fix clears.
 *
 * FIX 2 — HP→ATK cap base (Hu Tao, the SOLE stat-relative-cap character).
 *   Her Paramita HP→ATK cap is `atk_base × 4` — `statCapPost` reads
 *   `from: 'atk_base'` (a plain `makeStatItem('atk_base')`, NOT getTotal) × an
 *   `atk_percent[400]` table → 4 × atk_base (Hutao.js:155-158, SkillMaxBonus=400).
 *   The pre-fix adapter resolved `getTotal('atk') × 4` = atk_total × 4 — too loose.
 *     atk_base  1487.0403291 → cap atk_base×4  = 5948.1613164  (correct)
 *     atk_total 1754.707588338 → cap atk_total×4 = 7018.830353352 (old, wrong)
 *   The cap never binds at `base`; it binds on a high-HP build, where the two cap
 *   bases diverge. `capUsesBase` makes the cap read the base stat.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Furina.js:503-509 (A4 PostEffectStatsHP)
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats.js:58-66 (isPercent /100 fold)
 *   raw/genshin_calc_pub/src/js/db/Char/Hutao.js:145-159 (atk_base×4 statCapPost)
 *   tests/golden/fixtures/furina.json (base oracle)
 *   tests/golden/fixtures/stat-variance/furina.json (high-ATK/high-HP oracle)
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { furina } from "../characters/furina.js";
import { huTao } from "../characters/hu-tao.js";
import { alleyFlashStatTable, blackcliffPoleStatTable } from "../generated/weaponStatTables.js";
import type { CharPostEffect, DbObjectChar, StatTableEntry } from "@genshin/types";

// ---------------------------------------------------------------------------
// Build inputs — the two stat blocks (verbatim from the oracle configs)
// ---------------------------------------------------------------------------

/** Fixed canonical block (sampleStats) — tests/golden/fixtures/_manifest.json `base`. */
const SAMPLE_BLOCK = {
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

/** high-ATK/high-HP block — tools/oracle/build-configs.mjs HIGH_ATK_HP_BLOCK. */
const HIGH_ATK_HP_BLOCK = {
  recharge_base: 100,
  hp_base: 30000,
  atk_base: 871,
  def_base: 876,
  crit_dmg_base: 200,
  crit_rate_base: 70,
  dmg_pyro: 46.6,
  dmg_normal: 8,
  dmg_charged: 16,
  dmg_skill: 32,
  dmg_burst: 64,
  mastery_base: 200,
  atk_percent: 50,
  hp_percent: 46.6,
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
// Fixture loader (mirrors golden.test.ts)
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

/** Compile Furina under `statBlock` and assert every produced feature matches `fixture`. */
function assertFurinaMatches(
  statBlock: Readonly<Record<string, number>>,
  fixture: Fixture
): void {
  const { context } = buildStats({
    char: furina,
    weaponStatTable: alleyFlashStatTable as readonly StatTableEntry[],
    statBlock,
    levels: LEVELS,
    enemy: ENEMY,
    settings: {},
  });
  const compiled = compileCharacter(furina, {
    charElement: furina.element,
    talentLevels: TALENTS,
    settings: {},
    charLevel: LEVELS.charLevel,
  });

  const producedKeys = Object.keys(compiled).filter(
    (k) => k in fixture.features && isDamageTriple(fixture.features[k]!)
  );
  // The 3 salon-member hits carrying dmg_skill_furina MUST be among them — they
  // are the features whose value desyncs between base and stat-variance.
  expect(producedKeys).toEqual(
    expect.arrayContaining([
      "skill.furina_gentilhomme_usher_dmg",
      "skill.furina_surintendante_chevalmarin_dmg",
      "skill.furina_mademoiselle_crabaletta_dmg",
    ])
  );

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

// ---------------------------------------------------------------------------
// FIX 1 — Furina A4 dmg_skill_furina via the damageBonusesRaw channel
// ---------------------------------------------------------------------------

describe("Furina A4 — dmg_skill_furina recomputes from actual hp_total", () => {
  it("base build: dmg_skill_furina = 0.19973371845 (uncapped, fraction)", () => {
    const { stats } = buildStats({
      char: furina,
      weaponStatTable: alleyFlashStatTable as readonly StatTableEntry[],
      statBlock: SAMPLE_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });
    // min(0.0007 × 28533.38835, 28) / 100 = 19.973371845 / 100.
    expect(stats.dmg_skill_furina).toBeCloseTo(0.19973371845, 9);
  });

  it("stat-variance build: dmg_skill_furina = 0.28 (cap binds, fraction)", () => {
    const { stats } = buildStats({
      char: furina,
      weaponStatTable: alleyFlashStatTable as readonly StatTableEntry[],
      statBlock: HIGH_ATK_HP_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });
    // min(0.0007 × 66420.63, 28) = min(46.49, 28) = 28 → 0.28 (the 28% cap).
    expect(stats.dmg_skill_furina).toBeCloseTo(0.28, 9);
  });

  it("matches the base oracle (regression — the old hardcode was correct here)", () => {
    assertFurinaMatches(SAMPLE_BLOCK, loadFixture("furina.json"));
  });

  it("matches the stat-variance oracle (the build the old hardcode desynced on)", () => {
    assertFurinaMatches(HIGH_ATK_HP_BLOCK, loadFixture("stat-variance/furina.json"));
  });
});

// ---------------------------------------------------------------------------
// FIX 2 — HP→ATK cap base (Hu Tao caps on atk_base × 4, not atk_total × 4)
// ---------------------------------------------------------------------------

describe("Hu Tao HP→ATK cap — binds at atk_base × 4 (capUsesBase)", () => {
  function buildHuTao(
    settings: Record<string, unknown>,
    statBlock: Readonly<Record<string, number>>
  ) {
    return buildStats({
      char: huTao,
      weaponStatTable: blackcliffPoleStatTable as readonly StatTableEntry[],
      statBlock,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
    });
  }

  it("cap clamps the HP→ATK bonus at atk_base × 4 (= 5948.16), not atk_total × 4", () => {
    // Inflate HP so HP×0.06256 ≫ cap → the clamp bites. Paramita ON.
    const bigHp = { ...SAMPLE_BLOCK, hp_base: 200000 };
    const { stats } = buildHuTao({ hutao_paramita_papilio: true }, bigHp);
    const baseAtkTotal = 1754.7075883379998; // char+weapon+bonus, atk_percent 18
    const capBase = 1487.0403291 * 4; // atk_base × 4 = 5948.1613164
    expect(stats.atk_total).toBeCloseTo(baseAtkTotal + capBase, 2);
    // And NOT the old atk_total × 4 = 7018.83 cap.
    expect(stats.atk_total).not.toBeCloseTo(baseAtkTotal + 1754.7075883379998 * 4, 1);
  });

  it("base build (cap does not bind): Paramita ON adds HP×0.06256 uncapped", () => {
    // hp_total 28778.3066196 × 0.06256 = 1800.370862122176 < cap → no clamp.
    const { stats } = buildHuTao({ hutao_paramita_papilio: true }, SAMPLE_BLOCK);
    expect(stats.atk_total).toBeCloseTo(1754.7075883379998 + 1800.370862122176, 3);
  });
});

// ---------------------------------------------------------------------------
// FIX 2 (unit) — capUsesBase reads atk_base; the default still reads getTotal
// ---------------------------------------------------------------------------

describe("toPostEffect cap base — capUsesBase vs default getTotal", () => {
  // A synthetic always-on HP→ATK cap on the Hu Tao stat tables. ratio is huge so
  // the cap always binds, isolating the cap base. Two variants differ ONLY in the
  // capUsesBase flag, so the atk_total delta = (cap base difference) × capRatio.
  function cappedChar(capUsesBase: boolean): DbObjectChar {
    const effect: CharPostEffect = {
      priority: 1,
      fromStat: "hp",
      toStat: "atk",
      ratio: 1, // huge HP×1 → cap always binds
      cap: { capStat: "atk", capRatio: 4 },
      ...(capUsesBase ? { capUsesBase: true } : {}),
    };
    return { ...huTao, conditions: [], postEffects: [effect] };
  }

  function atkTotalOf(char: DbObjectChar): number | undefined {
    return buildStats({
      char,
      weaponStatTable: blackcliffPoleStatTable as readonly StatTableEntry[],
      statBlock: SAMPLE_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    }).stats.atk_total;
  }

  it("capUsesBase reads atk_base × capRatio (= 5948.16 cap)", () => {
    const baseAtkTotal = 1754.7075883379998;
    const atkBase = baseAtkTotal / 1.18; // 1487.0403291
    expect(atkTotalOf(cappedChar(true))).toBeCloseTo(baseAtkTotal + atkBase * 4, 2);
  });

  it("default (no flag) reads getTotal('atk') × capRatio (= 7018.83 cap)", () => {
    const baseAtkTotal = 1754.7075883379998;
    expect(atkTotalOf(cappedChar(false))).toBeCloseTo(baseAtkTotal + baseAtkTotal * 4, 2);
  });
});
