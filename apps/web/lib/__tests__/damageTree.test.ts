import { describe, it, expect } from "vitest";
import { computeBuild } from "../calc.js";
import { explainFeature } from "../damageTree.js";
import type { BuildForm } from "../types.js";

// SAMPLE_BLOCK — copied verbatim from calc.test.ts (see that file's comment for
// provenance: packages/data/src/__tests__/_statBlocks.ts SAMPLE_BLOCK).
const SAMPLE_BLOCK: Record<string, number> = {
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
};

const bennettTogglesForm: BuildForm = {
  characterKey: "bennett",
  weaponKey: "the_alley_flash",
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
  talents: { attack: 10, elemental: 10, burst: 10 },
  constellation: 0,
  weaponRefine: 1,
  conditions: { toggles: { bennet_fantastic_voyage: true }, stacks: {} },
  enemy: { level: 90, resistance: 10 },
  artifactMode: "manual",
  goodJson: "",
  manualStats: {},
  manualSets: [],
};

// Ganyu A1 "Undivided Heart" (crit_rate_ganyu +20%) applies ONLY to the two
// Frostflake Arrow features (critRateBonuses declared in packages/data/src/
// characters/ganyu.ts) — a per-feature crit modifier the bag-level
// reconstruction (crit_rate_total/crit_dmg_total only) cannot see, so it is a
// genuine residual case (verified via a scratch dump — see task-4-report.md).
const ganyuForm: BuildForm = {
  characterKey: "ganyu",
  weaponKey: "alley_hunter",
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
  talents: { attack: 10, elemental: 10, burst: 10 },
  constellation: 0,
  weaponRefine: 1,
  conditions: { toggles: { ganyu_undivided_heart: true }, stacks: {} },
  enemy: { level: 90, resistance: 10 },
  artifactMode: "manual",
  goodJson: "",
  manualStats: {},
  manualSets: [],
};

describe("explainFeature", () => {
  it("reconstructs the golden Bennett attack.normal_hit_1 with no residual", () => {
    const result = computeBuild(bennettTogglesForm, SAMPLE_BLOCK, []);
    expect(result.error).toBeUndefined();
    const f = result.features.find((x) => x.key === "attack.normal_hit_1")!;
    const [noncrit, , avg] = f.triple;

    const explained = explainFeature({
      avg,
      noncrit,
      element: "physical",
      damageType: "normal",
      stats: result.stats!,
      enemy: bennettTogglesForm.enemy,
      charLevel: bennettTogglesForm.charLevel,
    });

    expect(explained).not.toBeNull();
    const { nodes, product, residual } = explained!;
    expect(nodes.length).toBeGreaterThanOrEqual(4);
    expect(residual).toBeNull();
    expect(Math.abs(product * (residual ?? 1) - avg)).toBeLessThan(avg * 1e-6);
  });

  it("surfaces a non-null residual for Ganyu's Frostflake Arrow (A1 crit_rate_ganyu, unmodeled)", () => {
    const result = computeBuild(ganyuForm, SAMPLE_BLOCK, []);
    expect(result.error).toBeUndefined();
    const f = result.features.find((x) => x.key === "attack.ganyu_frostflake")!;
    const [noncrit, , avg] = f.triple;

    const explained = explainFeature({
      avg,
      noncrit,
      element: "cryo",
      damageType: "charged",
      stats: result.stats!,
      enemy: ganyuForm.enemy,
      charLevel: ganyuForm.charLevel,
    });

    expect(explained).not.toBeNull();
    const { product, residual } = explained!;
    expect(residual).not.toBeNull();
    // Still self-validating: product × residual must reproduce avg exactly.
    expect(Math.abs(product * (residual ?? 1) - avg)).toBeLessThan(avg * 1e-6);
  });

  it("returns null (breakdown unavailable) when required stats keys are missing", () => {
    const explained = explainFeature({
      avg: 100,
      noncrit: 90,
      element: "physical",
      damageType: "normal",
      stats: {},
      enemy: { level: 90, resistance: 10 },
      charLevel: 90,
    });
    expect(explained).toBeNull();
  });

  it("returns null when the element could not be determined", () => {
    const explained = explainFeature({
      avg: 100,
      noncrit: 90,
      element: null,
      damageType: "normal",
      stats: { crit_rate_total: 0.1, crit_dmg_total: 1 },
      enemy: { level: 90, resistance: 10 },
      charLevel: 90,
    });
    expect(explained).toBeNull();
  });
});
