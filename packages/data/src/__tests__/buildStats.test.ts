/**
 * buildStats — stats-bag assembly. Unit tests for each transform, plus the
 * Hu Tao stat totals against tests/golden/fixtures/hu_tao.json.
 *
 * Replicates the oracle's sequence (tools/oracle/engine.mjs → her
 * getBuildData): getBaseStats(bonus) folds char + weapon base stats from their
 * StatTables at the build's level/ascension, then totals are read at execution
 * time. Percent stats (DMG%, crit, resistance) are FRACTIONS in the emitted bag.
 */

import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import {
  minimalHuTao,
  blackcliffPoleStatTable,
} from "./fixtures/hu-tao.js";

// The fixed canonical build (tests/golden/fixtures/_manifest.json).
const FIXED = {
  char: { level: 90, ascension: 6, constellation: 0 },
  skills: { attack: 10, elemental: 10, burst: 10 },
  weapon: { level: 90, ascension: 6, refine: 1 },
  enemy: { level: 90, res: 10 },
  statBlock: {
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
  },
} as const;

function buildHuTao() {
  return buildStats({
    char: minimalHuTao,
    weaponStatTable: blackcliffPoleStatTable,
    statBlock: FIXED.statBlock,
    levels: {
      charLevel: FIXED.char.level,
      ascension: FIXED.char.ascension,
      weaponLevel: FIXED.weapon.level,
      weaponAscension: FIXED.weapon.ascension,
    },
    enemy: { level: FIXED.enemy.level, resistance: FIXED.enemy.res },
    settings: {},
  });
}

describe("buildStats — Hu Tao totals vs oracle (hu_tao.json stats.*)", () => {
  it("atk_total matches stats.atk (char+weapon+bonus base × (1+atk_percent))", () => {
    const { stats } = buildHuTao();
    expect(stats.atk_total).toBeCloseTo(1754.7075883379998, 3);
  });

  it("hp_total matches stats.hp", () => {
    const { stats } = buildHuTao();
    expect(stats.hp_total).toBeCloseTo(28778.3066196, 3);
  });

  it("def_total matches stats.def", () => {
    const { stats } = buildHuTao();
    expect(stats.def_total).toBeCloseTo(1752.1519818, 3);
  });

  it("mastery_total matches stats.mastery", () => {
    const { stats } = buildHuTao();
    expect(stats.mastery_total).toBeCloseTo(55, 3);
  });

  it("crit_dmg / crit_rate totals are emitted as FRACTIONS for the engine", () => {
    const { stats } = buildHuTao();
    // hu_tao.json: stats.crit_dmg = 193.528(%), stats.crit_rate = 10(%)
    expect(stats.crit_dmg_total).toBeCloseTo(1.93528, 5);
    expect(stats.crit_rate_total).toBeCloseTo(0.1, 5);
  });
});

describe("buildStats — transforms", () => {
  it("folds enemy.resistance (percent) into enemy_res_<element> FRACTIONS", () => {
    const { stats, context } = buildHuTao();
    // 10% on every element → 0.10 fraction
    for (const el of [
      "physical",
      "pyro",
      "hydro",
      "electro",
      "cryo",
      "anemo",
      "geo",
      "dendro",
    ]) {
      expect(stats[`enemy_res_${el}`]).toBeCloseTo(0.1, 5);
    }
    // The engine reads enemy_res_* from stats, never context.enemy.resistance.
    expect(context.enemy.level).toBe(90);
  });

  it("supports a per-element resistance map (folds each independently)", () => {
    const { stats } = buildStats({
      char: minimalHuTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: FIXED.statBlock,
      levels: {
        charLevel: 90,
        ascension: 6,
        weaponLevel: 90,
        weaponAscension: 6,
      },
      enemy: { level: 90, resistance: { pyro: 50, hydro: -20 } },
      settings: {},
    });
    expect(stats.enemy_res_pyro).toBeCloseTo(0.5, 5);
    expect(stats.enemy_res_hydro).toBeCloseTo(-0.2, 5);
    // Unspecified elements default to 0.
    expect(stats.enemy_res_cryo).toBe(0);
  });

  it("emits DMG% bonuses as fractions (dmg_normal, dmg_phys, …)", () => {
    const { stats } = buildHuTao();
    expect(stats.dmg_normal).toBeCloseTo(0.08, 5);
    expect(stats.dmg_phys).toBeCloseTo(0.04, 5);
    expect(stats.dmg_skill).toBeCloseTo(0.32, 5);
  });

  it("emits DEF-ignore / DEF-reduce keys (default 0)", () => {
    const { stats } = buildHuTao();
    expect(stats.enemy_def_ignore).toBe(0);
    expect(stats.enemy_def_reduce).toBe(0);
  });

  it("passes characterLevel through to the DamageContext", () => {
    const { context } = buildHuTao();
    expect(context.characterLevel).toBe(90);
  });
});

describe("buildStats — condition-gated HP→ATK post-effect (Paramita)", () => {
  function build(
    settings: Record<string, unknown>,
    statBlock: Record<string, number> = FIXED.statBlock
  ) {
    return buildStats({
      char: minimalHuTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock,
      levels: {
        charLevel: 90,
        ascension: 6,
        weaponLevel: 90,
        weaponAscension: 6,
      },
      enemy: { level: 90, resistance: 10 },
      settings,
    });
  }

  it("contributes nothing when Paramita is OFF (gate fails)", () => {
    const { stats } = build({});
    expect(stats.atk_total).toBeCloseTo(1754.7075883379998, 3);
  });

  it("adds HP×0.06256 to ATK when Paramita is ON — matches hu_tao.json skill.hutao_atk_bonus", () => {
    const { stats } = build({ hutao_paramita_papilio: true });
    // bonus = hp_total(28778.3066196) × 0.06256 = 1800.370862122176 (oracle value)
    expect(stats.atk_total).toBeCloseTo(1754.7075883379998 + 1800.370862122176, 3);
  });

  it("caps the HP→ATK bonus at capRatio × atk_BASE (capUsesBase)", () => {
    // Inflate HP so HP×0.06256 exceeds the 400%-of-atk_base cap and the clamp bites.
    // Her statCapPost base is `from: 'atk_base'` × atk_percent[400] = 4 × atk_base
    // (Hutao.js:155-158) — NOT getTotal('atk'). atk_base 1487.0403291 → cap =
    // 4 × 1487.0403291 = 5948.1613164. HP bonus uncapped at hp_base 200000 ≫ cap.
    const bigHp = { ...FIXED.statBlock, hp_base: 200000 };
    const { stats } = build({ hutao_paramita_papilio: true }, bigHp);
    const atkTotal = 1754.7075883379998;
    const atkBase = atkTotal / 1.18; // char+weapon+bonus atk_base = 1487.0403291
    const cap = atkBase * 4;
    expect(stats.atk_total).toBeCloseTo(atkTotal + cap, 2);
  });
});
