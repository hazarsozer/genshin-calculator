/**
 * compileFeature — the END-TO-END proof (P1.7a acceptance gate).
 *
 * Resolves the minimal Hu Tao's `normal_hit_1` Feature into a DamageBlock via
 * the full glue, runs it through the assembled stats (buildStats), and asserts
 * the [normal, crit, average] triple matches tests/golden/fixtures/hu_tao.json's
 * `attack.normal_hit_1`:
 *   normal  739.7741629224494
 *   crit   2171.4443049430074
 *   average 882.9411771245052
 *
 * Hitting these requires the whole pipeline: char+weapon base ATK (×1.18 percent),
 * talent% lookup at level 10, DMG% (dmg_normal+dmg_phys), DEF mult vs L90, RES
 * mult at 10% physical, and crit. Tolerance ~3 decimals (P1.8 sets the canonical
 * suite tolerance).
 */

import { describe, it, expect } from "vitest";
import { compile } from "@genshin/core";
import type { Feature, FeatureMultiplierEntry } from "@genshin/types";
import { buildStats } from "../buildStats.js";
import { compileFeature, type CompileContext } from "../compileFeature.js";
import { minimalHuTao, blackcliffPoleStatTable } from "./fixtures/hu-tao.js";

/** A constant talent table (1 entry) for synthetic branch-coverage features. */
function constTable(value: number): FeatureMultiplierEntry["values"] {
  return { getValue: () => value };
}

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

function buildHuTao() {
  return buildStats({
    char: minimalHuTao,
    weaponStatTable: blackcliffPoleStatTable,
    statBlock: STAT_BLOCK,
    levels: {
      charLevel: 90,
      ascension: 6,
      weaponLevel: 90,
      weaponAscension: 6,
    },
    enemy: { level: 90, resistance: 10 },
    settings: {},
  });
}

describe("compileFeature — Hu Tao normal_hit_1 end-to-end", () => {
  it("compiles a Feature into a DamageBlock and matches the oracle triple", () => {
    const { context } = buildHuTao();
    const feature = minimalHuTao.features[0]!; // normal_hit_1

    const block = compileFeature(feature, {
      charElement: minimalHuTao.element,
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    });
    const run = compile(block);
    const result = run(context);

    expect(result.normal).toBeCloseTo(739.7741629224494, 3);
    expect(result.crit).toBeCloseTo(2171.4443049430074, 3);
    expect(result.avg).toBeCloseTo(882.9411771245052, 3);
  });

  it("the compiled block is a CDamage root (triple-bearing)", () => {
    const feature = minimalHuTao.features[0]!;
    const block = compileFeature(feature, {
      charElement: minimalHuTao.element,
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    });
    expect(block.kind).toBe("damage");
  });
});

describe("compileFeature — composition transforms", () => {
  it("an un-infused normal attack resolves to physical (phys res + dmg_phys)", () => {
    // With no infusion settings, the normal attack is physical. Bump physical
    // resistance to 75% and verify the resistance multiplier responds (1/(1+4r)
    // at exactly 0.75 → 0.25), proving the physical RES key is read.
    const { context } = buildStats({
      char: minimalHuTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: {
        charLevel: 90,
        ascension: 6,
        weaponLevel: 90,
        weaponAscension: 6,
      },
      enemy: { level: 90, resistance: { physical: 75 } },
      settings: {},
    });
    const feature = minimalHuTao.features[0]!;
    const block = compileFeature(feature, {
      charElement: minimalHuTao.element,
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    });
    const result = compile(block)(context);

    // Re-derive: baseDmg × (1+0.12) × defMult(0.5) × resMult(0.25)
    // baseDmg = atk_total(1754.7075883379998) × 0.836496
    const baseDmg = 1754.7075883379998 * 0.836496;
    const expected = baseDmg * 1.12 * 0.5 * 0.25;
    expect(result.normal).toBeCloseTo(expected, 3);
  });

  it("respects pyro infusion via settings (reads enemy_res_pyro + dmg_pyro path)", () => {
    // attack_infusion: 'pyro' → the normal attack becomes pyro. dmg_phys(4%) no
    // longer applies; dmg_pyro is 0 here, so DMG% = 1 + dmg_normal(0.08) only.
    const { context } = buildStats({
      char: minimalHuTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: {
        charLevel: 90,
        ascension: 6,
        weaponLevel: 90,
        weaponAscension: 6,
      },
      enemy: { level: 90, resistance: 10 },
      settings: { attack_infusion: "pyro" },
    });
    const feature = minimalHuTao.features[0]!;
    const block = compileFeature(feature, {
      charElement: minimalHuTao.element,
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: { attack_infusion: "pyro" },
    });
    const result = compile(block)(context);

    // baseDmg × (1 + dmg_normal 0.08) × defMult 0.5 × resMult(pyro 0.9)
    const baseDmg = 1754.7075883379998 * 0.836496;
    const expected = baseDmg * 1.08 * 0.5 * 0.9;
    expect(result.normal).toBeCloseTo(expected, 3);
  });

  it("a skill feature uses its explicit element + dmg_skill + char_skill_elemental level", () => {
    const { context } = buildHuTao();
    const ctx: CompileContext = {
      charElement: "pyro",
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    };
    // talent% constant 100% (1.0) scaling ATK → baseDmg = atk_total.
    const skill: Feature = {
      name: "synthetic_skill",
      category: "skill",
      element: "pyro",
      multipliers: [{ leveling: "char_skill_elemental", values: constTable(100) }],
    };
    const result = compile(compileFeature(skill, ctx))(context);
    // baseDmg(atk_total) × (1 + dmg_skill 0.32) × defMult 0.5 × resMult(pyro 0.9)
    const expected = 1754.7075883379998 * 1.32 * 0.5 * 0.9;
    expect(result.normal).toBeCloseTo(expected, 3);
  });

  it("a burst feature uses dmg_burst + char_skill_burst level", () => {
    const { context } = buildHuTao();
    const ctx: CompileContext = {
      charElement: "pyro",
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    };
    const burst: Feature = {
      name: "synthetic_burst",
      category: "burst",
      element: "pyro",
      multipliers: [{ leveling: "char_skill_burst", values: constTable(100) }],
    };
    const result = compile(compileFeature(burst, ctx))(context);
    // baseDmg × (1 + dmg_burst 0.64) × defMult 0.5 × resMult(pyro 0.9)
    const expected = 1754.7075883379998 * 1.64 * 0.5 * 0.9;
    expect(result.normal).toBeCloseTo(expected, 3);
  });

  it("a plunge feature with no infusion stays physical and reads dmg_phys", () => {
    const { context } = buildHuTao();
    const ctx: CompileContext = {
      charElement: "pyro",
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    };
    const plunge: Feature = {
      name: "synthetic_plunge",
      category: "plunge",
      multipliers: [{ leveling: "char_skill_attack", values: constTable(100) }],
    };
    const result = compile(compileFeature(plunge, ctx))(context);
    // physical: (1 + dmg_phys 0.04) [no dmg_plunge in the bag] × defMult 0.5 × resMult(phys 0.9)
    const expected = 1754.7075883379998 * 1.04 * 0.5 * 0.9;
    expect(result.normal).toBeCloseTo(expected, 3);
  });

  it("flattens a multihit feature's items[] into the base-damage sum", () => {
    const { context } = buildHuTao();
    const ctx: CompileContext = {
      charElement: "pyro",
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    };
    // Two sub-items, each 50% ATK → base damage = atk_total × (0.5 + 0.5) = atk_total.
    const multihit: Feature = {
      name: "synthetic_multihit",
      category: "attack",
      items: [
        { multipliers: [{ leveling: "char_skill_attack", values: constTable(50) }] },
        { multipliers: [{ leveling: "char_skill_attack", values: constTable(50) }] },
      ],
    };
    const result = compile(compileFeature(multihit, ctx))(context);
    // physical normal: (1 + 0.08 + 0.04) × 0.5 × 0.9
    const expected = 1754.7075883379998 * 1.12 * 0.5 * 0.9;
    expect(result.normal).toBeCloseTo(expected, 3);
  });

  it("falls back to talent level 1 for an unknown leveling key", () => {
    const { context } = buildHuTao();
    const ctx: CompileContext = {
      charElement: "pyro",
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    };
    // Unknown leveling → level 1; constTable ignores level anyway, so value is 100%.
    const f: Feature = {
      name: "synthetic_unknown_leveling",
      category: "skill",
      element: "pyro",
      multipliers: [{ leveling: "weapon_refine", values: constTable(100) }],
    };
    const result = compile(compileFeature(f, ctx))(context);
    const expected = 1754.7075883379998 * 1.32 * 0.5 * 0.9;
    expect(result.normal).toBeCloseTo(expected, 3);
  });

  it("honours an explicit non-atk scaling stat (hp) via <stat>_total", () => {
    const { context } = buildHuTao();
    const ctx: CompileContext = {
      charElement: "pyro",
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    };
    // scaling 'hp*' → reads hp_total. 1% of HP, pyro skill.
    const f: Feature = {
      name: "synthetic_hp_scaling",
      category: "skill",
      element: "pyro",
      multipliers: [
        { scaling: "hp*", leveling: "char_skill_elemental", values: constTable(1) },
      ],
    };
    const result = compile(compileFeature(f, ctx))(context);
    // baseDmg = hp_total(28778.3066196) × 0.01; × (1+dmg_skill 0.32) × 0.5 × 0.9
    const baseDmg = 28778.3066196 * 0.01;
    const expected = baseDmg * 1.32 * 0.5 * 0.9;
    expect(result.normal).toBeCloseTo(expected, 3);
  });
});
