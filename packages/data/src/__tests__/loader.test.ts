/**
 * compileCharacter / featureKey — maps a character's features[] into named
 * compiled closures. Verified against the Hu Tao baseline.
 */

import { describe, it, expect } from "vitest";
import { compileCharacter, featureKey } from "../loader.js";
import { buildStats } from "../buildStats.js";
import { minimalHuTao, blackcliffPoleStatTable } from "./fixtures/hu-tao.js";

const STAT_BLOCK = {
  atk_base: 871,
  atk_percent: 18,
  crit_dmg_base: 50,
  crit_rate_base: 5,
  def_base: 876,
  dmg_normal: 8,
  dmg_phys: 4,
  hp_base: 13226,
  mastery_base: 55,
  recharge_base: 100,
} as const;

const COMPILE_CTX = {
  charElement: minimalHuTao.element,
  talentLevels: { attack: 10, elemental: 10, burst: 10 },
  settings: {},
} as const;

describe("loader", () => {
  it("featureKey builds the <category>.<name> key", () => {
    expect(featureKey(minimalHuTao.features[0]!)).toBe("attack.normal_hit_1");
  });

  it("compileCharacter produces named, executable closures matching the oracle", () => {
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
      settings: {},
    });

    const compiled = compileCharacter(minimalHuTao, COMPILE_CTX);
    expect(Object.keys(compiled)).toContain("attack.normal_hit_1");

    const result = compiled["attack.normal_hit_1"]!(context);
    expect(result.normal).toBeCloseTo(739.7741629224494, 3);
    expect(result.avg).toBeCloseTo(882.9411771245052, 3);
  });

  it("excludes child hits (isChild) from the compiled set", () => {
    const charWithChild = {
      ...minimalHuTao,
      features: [
        ...minimalHuTao.features,
        { ...minimalHuTao.features[0]!, name: "normal_hit_child", isChild: true },
      ],
    };
    const compiled = compileCharacter(charWithChild, COMPILE_CTX);
    expect(Object.keys(compiled)).not.toContain("attack.normal_hit_child");
  });
});
