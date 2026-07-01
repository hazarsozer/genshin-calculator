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
import type { DamageContext, Feature, FeatureMultiplierEntry, FeatureOutput } from "@genshin/types";
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

describe("compileFeature — non-damage outputs (P3.5.3, compileOutput)", () => {
  const compileCtx: CompileContext = {
    charElement: minimalHuTao.element,
    talentLevels: { attack: 10, elemental: 10, burst: 10 },
    settings: {},
    charLevel: 90,
  };

  // A synthetic non-damage feature: 100% of max HP (scaling 'hp', constant 100% so
  // the base term is exactly hp_total — isolates the kind-specific factor).
  function outputFeature(output: FeatureOutput): Feature {
    return {
      name: "synthetic_output",
      category: "skill",
      output,
      multipliers: [{ scaling: "hp", leveling: "", values: constTable(100) }],
    };
  }

  function run(extraStats: Record<string, number>, output: FeatureOutput) {
    const { context } = buildHuTao();
    const ctx: DamageContext = { ...context, stats: { ...context.stats, ...extraStats } };
    const hp = ctx.stats.hp_total as number;
    const result = compile(compileFeature(outputFeature(output), compileCtx))(ctx);
    return { result, hp };
  }

  it("static: bare base term, emitted as a non-crit triple (= 100% of hp_total)", () => {
    const { result, hp } = run({}, { kind: "static" });
    expect(result.normal).toBeCloseTo(hp, 3);
    expect(result.crit).toBeCloseTo(hp, 3); // non-crit: crit == normal
    expect(result.avg).toBeCloseTo(hp, 3);
  });

  it("shield: base × (1 + shield)", () => {
    const { result, hp } = run({ shield: 0.5 }, { kind: "shield" });
    expect(result.normal).toBeCloseTo(hp * 1.5, 3);
    expect(result.avg).toBeCloseTo(hp * 1.5, 3);
  });

  it("heal: base × (1 + healing + healing_base + healing_recv)", () => {
    const { result, hp } = run({ healing_recv: 0.3 }, { kind: "heal" });
    expect(result.normal).toBeCloseTo(hp * 1.3, 3);
    expect(result.crit).toBeCloseTo(hp * 1.3, 3); // non-crit (no critRateBonuses)
    expect(result.avg).toBeCloseTo(hp * 1.3, 3);
  });

  it("heal subtractBoL: base − bond_of_life × hp_total", () => {
    // healing bonuses 0 → base(hp) − 0.5·hp = 0.5·hp (her Arlecchino heal shape)
    const { result, hp } = run({ bond_of_life: 0.5 }, { kind: "heal", subtractBoL: true });
    expect(result.normal).toBeCloseTo(hp * 0.5, 3);
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

/**
 * M1 — stat-derived coefficient multiplier (Phase 3 ④, the new engine primitive).
 *
 * `coefficientFromStat` puts a RUNTIME coefficient on the base term, read from a
 * stat TOTAL, replacing the build-coupled constant folds:
 *   - sayu C6:  min(mastery_total × 0.002, 4) × ATK  (folded to const 30.2 @ EM=151)
 *   - kirara C1: min(floor(hp_total / 8000), 4)       (folded to scalingMultiplier 3 @ HP=31503)
 *
 * These tests are the FOLD-BUILD ANCHOR: at the frozen build's stat point the
 * coefficient must reproduce the old constant EXACTLY (parity), and off that point
 * it must track the live total (the whole reason the fold is being retired). They
 * lock the unit handling (sayu's 30.2 is a PERCENT: values/100) and the floor-then-cap
 * order (kirara hp=45000 → floor 5 → cap 4, NOT floor of the min).
 */
describe("compileFeature — coefficientFromStat (M1)", () => {
  /**
   * Build Hu Tao at a chosen raw EM / HP point, then assert the resulting LIVE
   * total (mastery_total / hp_total) the bag emits. The coefficient reads that
   * exact total, so anchoring on it proves M1 tracks the live build (not a literal).
   */
  function buildAt(statOverrides: Record<string, number>) {
    return buildStats({
      char: minimalHuTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: { ...STAT_BLOCK, ...statOverrides },
      levels: { charLevel: 90, ascension: 6, weaponLevel: 90, weaponAscension: 6 },
      enemy: { level: 90, resistance: 10 },
      settings: {},
    });
  }

  const PYRO_SKILL_CTX: CompileContext = {
    charElement: "pyro",
    talentLevels: { attack: 10, elemental: 10, burst: 10 },
    settings: {},
  };

  /** Resolve the normal-hit triple for a single-multiplier pyro skill feature. */
  function normalOf(multiplier: FeatureMultiplierEntry, ctxBag: ReturnType<typeof buildAt>): number {
    const feature: Feature = {
      name: "m1_probe",
      category: "skill",
      element: "pyro",
      multipliers: [multiplier],
    };
    return compile(compileFeature(feature, PYRO_SKILL_CTX))(ctxBag.context).normal;
  }

  // --- sayu C6: ratio path, percent channel -------------------------------

  it("sayu fold-build anchor: coefficientFromStat{mastery,0.002,cap4} on EM=151 == const 30.2", () => {
    // Pin mastery_total to exactly 151 (the frozen build's EM): mastery_base 55 →
    // bump to 151 via raw flat EM. The fold const 30.2 is a PERCENT (30.2/100 =
    // 0.302 fraction of ATK); the new form is values:()=>100 (→ 1.0) × coeff 0.302.
    const built = buildAt({ mastery_base: 151 });
    expect(built.context.stats["mastery_total"]).toBeCloseTo(151, 6);

    const dynamic = normalOf(
      {
        scaling: "atk",
        leveling: "",
        values: constTable(100),
        coefficientFromStat: { stat: "mastery", ratio: 0.002, cap: 4 },
      },
      built
    );
    const folded = normalOf(
      { scaling: "atk", leveling: "", values: constTable(30.2) },
      built
    );
    expect(dynamic).toBeCloseTo(folded, 6);
  });

  it("sayu coefficient TRACKS the live EM total off the fold build", () => {
    // At EM≈400 the coefficient is mastery×0.002 (≈0.8), NOT the frozen 0.302.
    // It must equal the SAME constant computed from this build's live total.
    const built = buildAt({ mastery_base: 400 });
    const em = built.context.stats["mastery_total"]!;
    const expectedCoeff = em * 0.002; // < cap 4
    const dynamic = normalOf(
      {
        scaling: "atk",
        leveling: "",
        values: constTable(100),
        coefficientFromStat: { stat: "mastery", ratio: 0.002, cap: 4 },
      },
      built
    );
    const equivalent = normalOf(
      { scaling: "atk", leveling: "", values: constTable(100 * expectedCoeff) },
      built
    );
    expect(dynamic).toBeCloseTo(equivalent, 6);
    // And NOT the frozen fold (proves it's not baked at 0.302).
    const frozen = normalOf({ scaling: "atk", leveling: "", values: constTable(30.2) }, built);
    expect(Math.abs(dynamic - frozen)).toBeGreaterThan(1);
  });

  it("sayu cap binds: EM=2500 → coefficient capped at 4 (not 5.0)", () => {
    const built = buildAt({ mastery_base: 2500 });
    expect(built.context.stats["mastery_total"]!).toBeGreaterThan(2000); // > cap/ratio
    const dynamic = normalOf(
      {
        scaling: "atk",
        leveling: "",
        values: constTable(100),
        coefficientFromStat: { stat: "mastery", ratio: 0.002, cap: 4 },
      },
      built
    );
    // capped: coeff 4 → values 100 × 4 ⇒ 400% ATK
    const capped = normalOf({ scaling: "atk", leveling: "", values: constTable(400) }, built);
    expect(dynamic).toBeCloseTo(capped, 6);
    // NOT the uncapped 5.0 (2500×0.002).
    const uncapped = normalOf({ scaling: "atk", leveling: "", values: constTable(500) }, built);
    expect(Math.abs(dynamic - uncapped)).toBeGreaterThan(1);
  });

  // --- kirara C1: divisor path (floor), via scalingMultiplier slot ----------

  it("kirara fold-build anchor: coefficientFromStat{hp,÷8000,cap4} at floor-3 HP == scalingMultiplier 3", () => {
    // The frozen build's hp_total floors to 3 (her HP=31503 → floor(31503/8000)=3).
    // This probe build's hp_total (≈28778) sits in the SAME floor-3 bucket, so the
    // coefficient is 3 — identical to the old scalingMultiplier:3 fold. Talent table
    // arbitrary (cancels in the comparison).
    const built = buildAt({});
    expect(Math.floor(built.context.stats["hp_total"]! / 8000)).toBe(3);

    const dynamic = normalOf(
      {
        scaling: "atk",
        leveling: "char_skill_burst",
        values: constTable(120),
        coefficientFromStat: { stat: "hp", divisor: 8000, cap: 4 },
      },
      built
    );
    const folded = normalOf(
      { scaling: "atk", leveling: "char_skill_burst", values: constTable(120), scalingMultiplier: 3 },
      built
    );
    expect(dynamic).toBeCloseTo(folded, 6);
  });

  it("kirara coefficient TRACKS live HP (floor) off the fold build", () => {
    // hp_base 3000 → HP≈18552 → floor(18552/8000)=2, NOT the frozen 3.
    const built = buildAt({ hp_base: 3000, hp_percent: 0 });
    const hp = built.context.stats["hp_total"]!;
    const expectedCoeff = Math.floor(hp / 8000);
    const dynamic = normalOf(
      {
        scaling: "atk",
        leveling: "char_skill_burst",
        values: constTable(120),
        coefficientFromStat: { stat: "hp", divisor: 8000, cap: 4 },
      },
      built
    );
    const equivalent = normalOf(
      { scaling: "atk", leveling: "char_skill_burst", values: constTable(120), scalingMultiplier: expectedCoeff },
      built
    );
    expect(dynamic).toBeCloseTo(equivalent, 6);
    expect(expectedCoeff).toBe(2); // off the frozen 3
  });

  it("kirara cap binds (floor THEN cap): floor 5 → capped 4, NOT floor(min)", () => {
    // hp_base 31503 → HP≈47055 → floor(47055/8000)=5 (above the cap 4).
    const built = buildAt({ hp_base: 31503, hp_percent: 0 });
    const hp = built.context.stats["hp_total"]!;
    expect(Math.floor(hp / 8000)).toBe(5); // raw floor is 5
    const dynamic = normalOf(
      {
        scaling: "atk",
        leveling: "char_skill_burst",
        values: constTable(120),
        coefficientFromStat: { stat: "hp", divisor: 8000, cap: 4 },
      },
      built
    );
    const capped = normalOf(
      { scaling: "atk", leveling: "char_skill_burst", values: constTable(120), scalingMultiplier: 4 },
      built
    );
    expect(dynamic).toBeCloseTo(capped, 6);
    // floor-THEN-cap, not floor-of-min: a hypothetical 5 would diverge.
    const uncapped = normalOf(
      { scaling: "atk", leveling: "char_skill_burst", values: constTable(120), scalingMultiplier: 5 },
      built
    );
    expect(Math.abs(dynamic - uncapped)).toBeGreaterThan(1);
  });

  // --- base-inert: absent field == today --------------------------------------

  it("absent coefficientFromStat is byte-identical to a plain term", () => {
    const built = buildAt({});
    const withoutField = normalOf(
      { scaling: "atk", leveling: "char_skill_elemental", values: constTable(100) },
      built
    );
    // Same multiplier, field simply not present → must match exactly.
    const plain = normalOf(
      { scaling: "atk", leveling: "char_skill_elemental", values: constTable(100) },
      built
    );
    expect(withoutField).toBe(plain);
    // And it equals the existing hand-derived expectation (atk_total × 1.0 path).
    const atkTotal = built.context.stats["atk_total"]!;
    const expected = atkTotal * 1.32 * 0.5 * 0.9; // (1+dmg_skill) × defMult × resMult(pyro)
    expect(withoutField).toBeCloseTo(expected, 3);
  });

  // --- fail-loud guards -------------------------------------------------------

  it("throws when coefficientFromStat and scalingMultiplier co-occur (mutually exclusive)", () => {
    const ctx: CompileContext = {
      charElement: "pyro",
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    };
    const feature: Feature = {
      name: "bad_feature",
      category: "skill",
      element: "pyro",
      multipliers: [
        {
          leveling: "char_skill_elemental",
          values: constTable(100),
          scalingMultiplier: 2,
          coefficientFromStat: { stat: "mastery", ratio: 0.002, cap: 4 },
        },
      ],
    };
    expect(() => compileFeature(feature, ctx)).toThrow(
      /mutually exclusive/
    );
  });

  it("throws when coefficientFromStat sets neither ratio nor divisor", () => {
    const ctx: CompileContext = {
      charElement: "pyro",
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings: {},
    };
    const feature: Feature = {
      name: "bad_feature",
      category: "skill",
      element: "pyro",
      multipliers: [
        {
          leveling: "char_skill_elemental",
          values: constTable(100),
          coefficientFromStat: { stat: "mastery", cap: 4 },
        },
      ],
    };
    expect(() => compileFeature(feature, ctx)).toThrow(
      /exactly one of ratio \| divisor/
    );
  });
});

// ===========================================================================
// Ocean-Hued Clam foam (M4b) — her FeatureDamageClam: a special damage hit with
// NO crit, NO dmg-bonus, DEF IGNORED, and a per-multiplier 30000 cap. Resistance
// STILL applies (Clam.js overrides only getStatsDmgBonus/getStatsCritRate/
// getStatsCritDamage → [] and getDefenceLevelMultiplier → 1). The hit scales the
// BARE bag key `accumulated_healing` (a non-`*` scaling read verbatim by cStat).
// ===========================================================================

describe("compileFeature — Clam foam suppression flags (no-crit / no-dmg-bonus / DEF-ignore / cap)", () => {
  // A synthetic eval bag with a chosen accumulated_healing + non-trivial crit /
  // dmg-bonus / def-reduce so the suppression flags are PROVABLY exercised: if any
  // of them were ignored, the value would move off the suppressed result.
  function bagWith(accumulatedHealing: number): DamageContext {
    const stats = {
      accumulated_healing: accumulatedHealing,
      // Non-zero crit (would inflate crit/avg if not suppressed):
      crit_rate_total: 0.5,
      crit_dmg_total: 1.0,
      // Non-zero dmg bonuses (would inflate normal if not suppressed):
      dmg_all: 0.466,
      dmg_phys: 0.4,
      // Physical resistance 10% → res multiplier 0.9 (STILL applies).
      enemy_res_physical: 0.1,
      // Non-zero DEF-reduce (would change the def multiplier if not ignored):
      enemy_def_reduce: 0.2,
    } as unknown as DamageContext["stats"];
    return { stats, enemy: { level: 90, resistance: {} }, characterLevel: 90 };
  }

  const FOAM_CTX: CompileContext = {
    charElement: "hydro", // ignored — the foam carries an explicit physical element
    talentLevels: { attack: 10, elemental: 10, burst: 10 },
    settings: {},
  };

  /** The foam feature: physical, scales 0.9 × accumulated_healing, capped 30000, all suppressions on. */
  function foamFeature(): Feature {
    return {
      name: "sea_dyed_foam_dmg",
      element: "physical",
      noCrit: true,
      noDamageBonus: true,
      ignoreEnemyDefence: true,
      multipliers: [
        {
          scaling: "accumulated_healing",
          leveling: "",
          values: constTable(90), // 90% → 0.9 fraction
          capValue: 30000,
        },
      ],
    };
  }

  it("foam below the cap: normal == crit == avg == 0.9 × ah × res (no crit / no dmg-bonus / DEF-ignored)", () => {
    const ah = 20000;
    const result = compile(compileFeature(foamFeature(), FOAM_CTX))(bagWith(ah));
    // 0.9 × 20000 = 18000 (< cap); × res 0.9 = 16200; def ignored (×1); no dmg-bonus; no crit.
    expect(result.normal).toBeCloseTo(16200, 6);
    expect(result.crit).toBeCloseTo(16200, 6); // no crit → crit == normal
    expect(result.avg).toBeCloseTo(16200, 6); // no crit → avg == normal
  });

  it("the 30000 cap binds on the BASE term (pre-res), exactly her CValueCap", () => {
    // ah huge → 0.9 × ah ≫ 30000, capped to 30000 BEFORE res → 30000 × 0.9 = 27000.
    const result = compile(compileFeature(foamFeature(), FOAM_CTX))(bagWith(1_000_000));
    expect(result.normal).toBeCloseTo(27000, 6);
    expect(result.crit).toBeCloseTo(27000, 6);
  });

  it("noCrit suppression is real: WITHOUT it, the same bag would crit (control)", () => {
    const ah = 20000;
    const noSuppress: Feature = {
      name: "control",
      element: "physical",
      // no suppression flags
      multipliers: [{ scaling: "accumulated_healing", leveling: "", values: constTable(90) }],
    };
    const result = compile(compileFeature(noSuppress, FOAM_CTX))(bagWith(ah));
    // crit_rate 0.5, crit_dmg +100% → crit = normal × 2, avg between. Proves the bag CAN crit.
    expect(result.crit).toBeGreaterThan(result.normal * 1.9);
  });
});

// ===========================================================================
// scalingMultiplierCondition + scalingMultiplierFromTable (S2-α) — the two new
// base-inert scaling-multiplier forms. Her getScalingMultiplier (Multiplier.js:157-162)
// gates the constant on a condition (INACTIVE → 1); FeatureMultiplierNeuvilleteCharged
// overrides it with a ValueTable lookup keyed by a settings level (level>0 → getValue,
// else 1). Both read ctx.settings at compile time and REPLACE nothing when absent.
// ===========================================================================

describe("compileFeature — scalingMultiplierCondition + scalingMultiplierFromTable (S2-α)", () => {
  const { context } = buildHuTao();

  /** Compile a single-multiplier pyro-skill feature under `settings`, return its normal. */
  function normalUnder(
    multiplier: FeatureMultiplierEntry,
    settings: Record<string, unknown>
  ): number {
    const feature: Feature = {
      name: "sm_probe",
      category: "skill",
      element: "pyro",
      multipliers: [multiplier],
    };
    const ctx: CompileContext = {
      charElement: "pyro",
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings,
    };
    return compile(compileFeature(feature, ctx))(context).normal;
  }

  // A plain 100%-of-ATK skill term (talentPercent 1.0 × atk_total); every case below
  // varies ONLY the scaling factor, so the whole triple scales linearly with it.
  const BASE: FeatureMultiplierEntry = { scaling: "atk", leveling: "", values: constTable(100) };

  // --- scalingMultiplierCondition (Freminet frost ×2 form) --------------------

  it("conditional gate INACTIVE → factor reverts to 1 (byte-identical to the plain term)", () => {
    const gated = normalUnder(
      { ...BASE, scalingMultiplier: 2, scalingMultiplierCondition: { type: "boolean", name: "gate" } },
      {} // gate off → her getScalingMultiplier returns 1
    );
    expect(gated).toBe(normalUnder(BASE, {}));
  });

  it("conditional gate ACTIVE → the constant applies (== plain × 2)", () => {
    const gated = normalUnder(
      { ...BASE, scalingMultiplier: 2, scalingMultiplierCondition: { type: "boolean", name: "gate" } },
      { gate: true }
    );
    expect(gated).toBeCloseTo(normalUnder(BASE, {}) * 2, 6);
  });

  it("absent gate → the constant applies unconditionally (control, unchanged from today)", () => {
    expect(normalUnder({ ...BASE, scalingMultiplier: 2 }, {})).toBeCloseTo(
      normalUnder(BASE, {}) * 2,
      6
    );
  });

  // --- scalingMultiplierFromTable (Neuvillette [1.1,1.25,1.6] form) -----------

  function tableMult(): FeatureMultiplierEntry {
    return { ...BASE, scalingMultiplierFromTable: { table: [1.1, 1.25, 1.6], levelSetting: "legacy" } };
  }

  it("table level 0 / absent → factor 1 (byte-identical to the plain term, base-inert)", () => {
    expect(normalUnder(tableMult(), {})).toBe(normalUnder(BASE, {}));
    expect(normalUnder(tableMult(), { legacy: 0 })).toBe(normalUnder(BASE, {}));
  });

  it("table levels 1/2/3 → table[level-1] factor (1-indexed, her ValueTable)", () => {
    const plain = normalUnder(BASE, {});
    expect(normalUnder(tableMult(), { legacy: 1 })).toBeCloseTo(plain * 1.1, 6);
    expect(normalUnder(tableMult(), { legacy: 2 })).toBeCloseTo(plain * 1.25, 6);
    expect(normalUnder(tableMult(), { legacy: 3 })).toBeCloseTo(plain * 1.6, 6);
  });

  it("table level beyond length clamps to the last entry (her ValueTable clamp)", () => {
    expect(normalUnder(tableMult(), { legacy: 5 })).toBeCloseTo(normalUnder(BASE, {}) * 1.6, 6);
  });

  // --- gated table (Wriothesley/Wanderer/Yoimiya toggle form) -----------------
  // Her FeatureMultiplier{Wriothesley,Wanderer,Yoimiya} multiply the table factor into the
  // term ONLY while a toggle is on; an INACTIVE gate leaves the term un-boosted (factor 1).

  function gatedTableMult(): FeatureMultiplierEntry {
    return {
      ...BASE,
      scalingMultiplierFromTable: {
        table: [1.1, 1.25, 1.6],
        levelSetting: "legacy",
        condition: { type: "boolean", name: "gate" },
      },
    };
  }

  it("gated table with an INACTIVE gate → factor 1 even when the level is set", () => {
    // gate off → factor 1 despite legacy 3 (her `result` stays 1 when the toggle is off).
    expect(normalUnder(gatedTableMult(), { legacy: 3 })).toBe(normalUnder(BASE, {}));
  });

  it("gated table with an ACTIVE gate → the table lookup applies (== plain × 1.6)", () => {
    expect(normalUnder(gatedTableMult(), { legacy: 3, gate: true })).toBeCloseTo(
      normalUnder(BASE, {}) * 1.6,
      6
    );
  });

  // --- `_bonus`-aware level read for a char-skill levelSetting ----------------
  // A char-skill leveling key reads the build's talent level (ctx.talentLevels[slot]=10 here)
  // PLUS the constellation `_bonus` — her getLevel('char_skill_elemental') = base + `_bonus`.
  // A non-char-skill key has no `<key>_bonus` → the read is unchanged (proven above/Neuvillette).

  // A 15-entry ramp: level L → L/10, so the resolved level is directly observable in the factor.
  const RAMP: readonly number[] = Array.from({ length: 15 }, (_u, i) => (i + 1) / 10);

  function charSkillTableMult(): FeatureMultiplierEntry {
    return { ...BASE, scalingMultiplierFromTable: { table: RAMP, levelSetting: "char_skill_elemental" } };
  }

  it("char-skill levelSetting reads talentLevels[slot] (no `_bonus` → level 10 → ×1.0)", () => {
    expect(normalUnder(charSkillTableMult(), {})).toBeCloseTo(normalUnder(BASE, {}) * 1.0, 6);
  });

  it("char-skill levelSetting adds the constellation `_bonus` (level 10+3=13 → ×1.3)", () => {
    expect(normalUnder(charSkillTableMult(), { char_skill_elemental_bonus: 3 })).toBeCloseTo(
      normalUnder(BASE, {}) * 1.3,
      6
    );
  });

  // --- fail-loud: the table form is a full override --------------------------

  it("throws when scalingMultiplierFromTable co-occurs with scalingMultiplier", () => {
    expect(() =>
      normalUnder(
        { ...BASE, scalingMultiplier: 2, scalingMultiplierFromTable: { table: [1.1], levelSetting: "legacy" } },
        {}
      )
    ).toThrow(/the table form replaces both/);
  });

  it("throws when scalingMultiplierFromTable co-occurs with scalingMultiplierCondition", () => {
    expect(() =>
      normalUnder(
        {
          ...BASE,
          scalingMultiplierCondition: { type: "boolean", name: "gate" },
          scalingMultiplierFromTable: { table: [1.1], levelSetting: "legacy" },
        },
        {}
      )
    ).toThrow(/the table form replaces both/);
  });
});
