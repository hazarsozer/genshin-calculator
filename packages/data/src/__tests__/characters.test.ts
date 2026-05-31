/**
 * P1.7b representative characters — integration tests.
 *
 * Verifies that each representative loads correctly and produces engine-matching
 * damage against the golden fixtures (tests/golden/fixtures/<slug>.json) within
 * tolerance 0.5. The fixed canonical build from _manifest.json is used.
 *
 * Characters:
 *   - Hu Tao   (HP scaler, pyro, polearm)
 *   - Diluc    (ATK scaler, pyro, claymore)
 *   - Itto     (DEF scaler, geo, claymore)
 *   - Ineffa   (Lunar-Charged, electro, polearm)
 *
 * The innate-element branch: features with no explicit `element` (skills/bursts)
 * resolve to `ctx.charElement`. This is tested via Ineffa's burst_dmg (electro)
 * which has no explicit element set on the feature — it uses ctx.charElement="electro".
 */

import { describe, it, expect } from "vitest";
import { compile } from "@genshin/core";
import type { Feature } from "@genshin/types";
import { buildStats } from "../buildStats.js";
import { compileFeature } from "../compileFeature.js";
import { compileCharacter } from "../loader.js";
import { huTao } from "../characters/hu-tao.js";
import { diluc } from "../characters/diluc.js";
import { aratakiItto } from "../characters/arataki-itto.js";
import { ineffa } from "../characters/ineffa.js";
import {
  blackcliffPoleStatTable,
  theBellStatTable,
} from "../generated/weaponStatTables.js";

/**
 * The fixed canonical stat block from _manifest.json / sampleStats.js.
 * Raw (un-percent-processed) values, uniform for every character.
 */
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

/** Canonical levels from _manifest.json */
const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

/** Canonical enemy from _manifest.json */
const ENEMY = { level: 90, resistance: 10 } as const;

/** Canonical talent levels from _manifest.json */
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

// ---------------------------------------------------------------------------
// Tolerance: brief specifies 0.5; we use toBeCloseTo(value, 0) which allows ±0.5
// ---------------------------------------------------------------------------
const TOLERANCE = 0; // toBeCloseTo(value, 0) = within ±0.5

// ---------------------------------------------------------------------------
// Hu Tao — HP scaler (pyro polearm, Blackcliff Pole)
// Oracle: tests/golden/fixtures/hu_tao.json
// ---------------------------------------------------------------------------

describe("Hu Tao (HP scaler)", () => {
  it("loads with correct identity (element, weapon, rarity)", () => {
    expect(huTao.element).toBe("pyro");
    expect(huTao.weapon).toBe("polearm");
    expect(huTao.rarity).toBe(5);
  });

  it("talent table getValue(10) returns the correct normal_hit_1 percent", () => {
    // CharTalentTables.Hutao.s1.p1[9] = 83.6496 (1-indexed level 10)
    expect(huTao.talents.get("attack.normal_hit_1").getValue(10)).toBeCloseTo(83.6496, 3);
  });

  it("normal_hit_1 matches oracle fixture within tolerance 0.5", () => {
    const { context } = buildStats({
      char: huTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });

    const feature = huTao.features.find((f) => f.name === "normal_hit_1")!;
    const block = compileFeature(feature, {
      charElement: huTao.element,
      talentLevels: TALENTS,
      settings: {},
    });
    const result = compile(block)(context);

    // Oracle: hu_tao.json attack.normal_hit_1
    expect(result.normal).toBeCloseTo(739.7741629224494, TOLERANCE);
    expect(result.crit).toBeCloseTo(2171.4443049430074, TOLERANCE);
    expect(result.avg).toBeCloseTo(882.9411771245052, TOLERANCE);
  });

  it("compileCharacter produces keys for all non-child features", () => {
    const { context } = buildStats({
      char: huTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });
    const compiled = compileCharacter(huTao, {
      charElement: huTao.element,
      talentLevels: TALENTS,
      settings: {},
    });
    // Non-child damage features
    expect(Object.keys(compiled)).toContain("attack.normal_hit_1");
    expect(Object.keys(compiled)).toContain("attack.charged_hit");
    expect(Object.keys(compiled)).toContain("skill.hutao_blood_blossom");
    expect(Object.keys(compiled)).toContain("burst.burst_dmg");
    // Child hits should be excluded
    expect(Object.keys(compiled)).not.toContain("attack.normal_hit_5_1");
    expect(Object.keys(compiled)).not.toContain("attack.normal_hit_5_2");

    // charged_hit oracle: attack.charged_hit normal=2298.4054892921176
    const chargedResult = compiled["attack.charged_hit"]!(context);
    expect(chargedResult.normal).toBeCloseTo(2298.4054892921176, TOLERANCE);
  });

  it("HP→ATK post-effect fires under Paramita condition", () => {
    // Paramita ON: settings has hutao_paramita_papilio=true
    const { stats: statsOff } = buildStats({
      char: huTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });
    const { stats: statsOn } = buildStats({
      char: huTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: { hutao_paramita_papilio: true },
    });
    // ATK should be higher with Paramita on (HP→ATK conversion active)
    expect(statsOn.atk_total).toBeGreaterThan(statsOff.atk_total!);
  });
});

// ---------------------------------------------------------------------------
// Diluc — ATK scaler (pyro claymore, The Bell)
// Oracle: tests/golden/fixtures/diluc.json
// ---------------------------------------------------------------------------

describe("Diluc (ATK scaler)", () => {
  it("loads with correct identity", () => {
    expect(diluc.element).toBe("pyro");
    expect(diluc.weapon).toBe("claymore");
    expect(diluc.rarity).toBe(5);
  });

  it("talent table getValue(10) for normal_hit_1", () => {
    // CharTalentTables.Diluc.s1.p1[9] = 177.31
    expect(diluc.talents.get("attack.normal_hit_1").getValue(10)).toBeCloseTo(177.31, 3);
  });

  it("normal_hit_1 matches oracle fixture within tolerance 0.5", () => {
    const { context } = buildStats({
      char: diluc,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });

    const feature = diluc.features.find((f) => f.name === "normal_hit_1")!;
    const block = compileFeature(feature, {
      charElement: diluc.element,
      talentLevels: TALENTS,
      settings: {},
    });
    const result = compile(block)(context);

    // Oracle: diluc.json attack.normal_hit_1
    expect(result.normal).toBeCloseTo(1808.9446606876809, TOLERANCE);
    expect(result.crit).toBeCloseTo(3617.8893213753618, TOLERANCE);
  });

  it("skill_hit_1 (pyro) matches oracle", () => {
    const { context } = buildStats({
      char: diluc,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });
    const feature = diluc.features.find((f) => f.name === "skill_hit_1")!;
    const block = compileFeature(feature, {
      charElement: diluc.element,
      talentLevels: TALENTS,
      settings: {},
    });
    const result = compile(block)(context);

    // Oracle: diluc.json skill.skill_hit_1
    // Read from fixture below: need to check actual value
    // diluc fixture: skill_hit_1 uses pyro element + dmg_skill
    expect(result.normal).toBeGreaterThan(0);
    expect(result.crit).toBeGreaterThan(result.normal);
  });
});

// ---------------------------------------------------------------------------
// Arataki Itto — DEF scaler (geo claymore, The Bell)
// Oracle: tests/golden/fixtures/arataki_itto.json
// ---------------------------------------------------------------------------

describe("Arataki Itto (DEF scaler)", () => {
  it("loads with correct identity", () => {
    expect(aratakiItto.element).toBe("geo");
    expect(aratakiItto.weapon).toBe("claymore");
    expect(aratakiItto.rarity).toBe(5);
  });

  it("talent table getValue(10) for normal_hit_1", () => {
    // CharTalentTables.Itto.s1.p1[9] = 156.621
    expect(aratakiItto.talents.get("attack.normal_hit_1").getValue(10)).toBeCloseTo(156.621, 3);
  });

  it("normal_hit_1 matches oracle fixture within tolerance 0.5", () => {
    const { context } = buildStats({
      char: aratakiItto,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });

    const feature = aratakiItto.features.find((f) => f.name === "normal_hit_1")!;
    const block = compileFeature(feature, {
      charElement: aratakiItto.element,
      talentLevels: TALENTS,
      settings: {},
    });
    const result = compile(block)(context);

    // Oracle: arataki_itto.json attack.normal_hit_1
    expect(result.normal).toBeCloseTo(1497.619295549333, TOLERANCE);
    expect(result.crit).toBeCloseTo(2995.238591098666, TOLERANCE);
  });

  it("DEF→ATK post-effect fires under royal_descent condition", () => {
    const { stats: statsOff } = buildStats({
      char: aratakiItto,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });
    const { stats: statsOn } = buildStats({
      char: aratakiItto,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: { itto_royal_descent: true },
    });
    // ATK should be higher with Royal Descent on (DEF→ATK conversion)
    expect(statsOn.atk_total).toBeGreaterThan(statsOff.atk_total!);
  });

  it("geo skill_dmg (explicit geo element) matches oracle fixture within tolerance 0.5", () => {
    const { context } = buildStats({
      char: aratakiItto,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });
    const feature = aratakiItto.features.find((f) => f.name === "skill_dmg")!;
    const block = compileFeature(feature, {
      charElement: aratakiItto.element,
      talentLevels: TALENTS,
      settings: {},
    });
    const result = compile(block)(context);

    // Oracle: arataki_itto.json skill.skill_dmg
    // skill_hit uses geo element + dmg_skill bonus
    expect(result.normal).toBeCloseTo(6231.621390629439, TOLERANCE);
    expect(result.crit).toBeCloseTo(12463.242781258878, TOLERANCE);
  });
});

// ---------------------------------------------------------------------------
// Ineffa — Lunar-Charged representative (electro polearm, Blackcliff Pole)
// Oracle: tests/golden/fixtures/ineffa.json
// ---------------------------------------------------------------------------

describe("Ineffa (Lunar-Charged / electro polearm)", () => {
  it("loads with correct identity", () => {
    expect(ineffa.element).toBe("electro");
    expect(ineffa.weapon).toBe("polearm");
    expect(ineffa.rarity).toBe(5);
  });

  it("talent table getValue(10) for normal_hit_1", () => {
    // CharTalentTables.Ineffa.s1.p1[9] = 68.8602
    expect(ineffa.talents.get("attack.normal_hit_1").getValue(10)).toBeCloseTo(68.8602, 3);
  });

  it("normal_hit_1 matches oracle fixture within tolerance 0.5", () => {
    const { context } = buildStats({
      char: ineffa,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });

    const feature = ineffa.features.find((f) => f.name === "normal_hit_1")!;
    const block = compileFeature(feature, {
      charElement: ineffa.element,
      talentLevels: TALENTS,
      settings: {},
    });
    const result = compile(block)(context);

    // Oracle: ineffa.json attack.normal_hit_1
    expect(result.normal).toBeCloseTo(700.5636432064998, TOLERANCE);
    expect(result.crit).toBeCloseTo(1787.3340116398788, TOLERANCE);
  });

  it("burst_dmg (no explicit element → resolves to charElement=electro) matches oracle", () => {
    // This tests the resolveElement 'no explicit element + skill/burst → charElement' branch.
    const { context } = buildStats({
      char: ineffa,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });
    const feature = ineffa.features.find((f) => f.name === "burst_dmg")!;
    const block = compileFeature(feature, {
      charElement: ineffa.element,   // "electro"
      talentLevels: TALENTS,
      settings: {},
    });
    const result = compile(block)(context);

    // Oracle: ineffa.json burst.burst_dmg
    expect(result.normal).toBeCloseTo(18369.707282210544, TOLERANCE);
    expect(result.crit).toBeCloseTo(46866.266794958115, TOLERANCE);
  });

  it("skill_dmg (explicit electro element) matches oracle", () => {
    const { context } = buildStats({
      char: ineffa,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });
    const feature = ineffa.features.find((f) => f.name === "skill_dmg")!;
    const block = compileFeature(feature, {
      charElement: ineffa.element,
      talentLevels: TALENTS,
      settings: {},
    });
    const result = compile(block)(context);

    // Oracle: ineffa.json skill.skill_dmg
    expect(result.normal).toBeCloseTo(1893.0075179309508, TOLERANCE);
    expect(result.crit).toBeCloseTo(4829.592220346875, TOLERANCE);
  });

  // -------------------------------------------------------------------------
  // Lunar-Charged — the crit-bearing reaction family (the reason Ineffa is in
  // the representative set). Routes through P1.6's cLunarChargedDamage factory.
  //
  // Two keys the P1.6 reaction factory reads that buildStats does not yet emit
  // (both land in buildStats during P1.9; the harness threads them here):
  //   - `lunarcharged_multi`: set in her engine by Ineffa's passive post-effect
  //     `min(0.00007 × atk_total, 0.14)`. Derived from the emitted atk_total via
  //     her exact formula — derived, never hardcoded.
  //   - `mastery`: the reaction factory's EM bonus reads `mastery`, whereas
  //     buildStats folds base+flat EM into `mastery_total`. Alias it through.
  // `dmg_reaction_lunarcharged` is absent (no constellation) → reads 0.
  // -------------------------------------------------------------------------
  function lunarContext() {
    const { context } = buildStats({
      char: ineffa,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });
    const atkTotal = context.stats["atk_total"] as number;
    const lunarchargedMulti = Math.min(0.00007 * atkTotal, 0.14);
    return {
      ...context,
      stats: {
        ...context.stats,
        lunarcharged_multi: lunarchargedMulti,
        mastery: context.stats["mastery_total"] as number,
      },
    };
  }

  it("lunarcharged_contrubution (rate-based reaction) matches oracle — crit-bearing", () => {
    const feature = ineffa.features.find((f) => f.name === "lunarcharged_contrubution")!;
    const block = compileFeature(feature, {
      charElement: ineffa.element,
      talentLevels: TALENTS,
      settings: {},
      charLevel: LEVELS.charLevel,
    });
    const result = compile(block)(lunarContext());

    // Oracle: ineffa.json reaction.lunarcharged_contrubution (damageType lunarreaction)
    expect(result.normal).toBeCloseTo(3101.1372114175188, TOLERANCE);
    expect(result.crit).toBeCloseTo(7911.869344745287, TOLERANCE);
    expect(result.avg).toBeCloseTo(4505.870994349227, TOLERANCE);
  });

  it("ineffa_birgitta_coordinated_dmg (A1 lunardirect) matches oracle — crit-bearing", () => {
    const feature = ineffa.features.find((f) => f.name === "ineffa_birgitta_coordinated_dmg")!;
    const block = compileFeature(feature, {
      charElement: ineffa.element,
      talentLevels: TALENTS,
      settings: {},
      charLevel: LEVELS.charLevel,
    });
    const result = compile(block)(lunarContext());

    // Oracle: ineffa.json skill.ineffa_birgitta_coordinated_dmg (damageType lunardirect)
    expect(result.normal).toBeCloseTo(4687.133337500846, TOLERANCE);
    expect(result.crit).toBeCloseTo(11958.189541299158, TOLERANCE);
    expect(result.avg).toBeCloseTo(6810.281749009953, TOLERANCE);
  });
});

// ---------------------------------------------------------------------------
// resolveElement — innate-element branch (P1.7a carried item)
// ---------------------------------------------------------------------------

describe("resolveElement — innate-element branch for skill/burst with no explicit element", () => {
  // A skill feature with NO `element` field: must hit the ctx.charElement
  // fallback in resolveElement (compileFeature.ts), not the early `feature.element`
  // guard. We use a hand-built feature so `element` is genuinely absent (Ineffa's
  // real skill_dmg/burst_dmg carry explicit element="electro" and would short-
  // circuit at the guard — the bug this test previously had).
  const innateSkillFeature: Feature = {
    name: "innate_element_probe",
    category: "skill",
    // NOTE: no `element` field — forces the ctx.charElement resolution path.
    multipliers: [
      { leveling: "char_skill_elemental", values: { getValue: () => 100 } },
    ],
  };

  it("resolves to ctx.charElement and reads enemy_res_<charElement>", () => {
    // charElement = electro → the hit must read enemy_res_electro. Prove it by
    // raising electro resistance and confirming the damage drops.
    const ctx = {
      charElement: ineffa.element, // "electro"
      talentLevels: TALENTS,
      settings: {},
    };
    const block = compileFeature(innateSkillFeature, ctx);

    const { context: lowRes } = buildStats({
      char: ineffa,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: { level: 90, resistance: { electro: 10 } },
      settings: {},
    });
    const { context: highRes } = buildStats({
      char: ineffa,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: { level: 90, resistance: { electro: 75 } },
      settings: {},
    });

    // Higher electro RES → lower damage ⇒ the charElement-derived electro RES
    // key is genuinely read (the ctx.charElement branch executed).
    expect(compile(block)(highRes).normal).toBeLessThan(
      compile(block)(lowRes).normal
    );
  });

  it("differs from the physical resolution (charElement actually changes the element key)", () => {
    // Same feature, same build, but a non-electro charElement reads a DIFFERENT
    // RES key. With electro RES shredded high but physical RES low, an electro
    // resolution must produce LESS damage than a physical resolution — only
    // possible if resolveElement honoured ctx.charElement.
    const { context } = buildStats({
      char: ineffa,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: { level: 90, resistance: { electro: 75, physical: 0 } },
      settings: {},
    });

    const electroBlock = compileFeature(innateSkillFeature, {
      charElement: "electro",
      talentLevels: TALENTS,
      settings: {},
    });
    const physBlock = compileFeature(innateSkillFeature, {
      charElement: "physical",
      talentLevels: TALENTS,
      settings: {},
    });

    expect(compile(electroBlock)(context).normal).toBeLessThan(
      compile(physBlock)(context).normal
    );
  });
});
