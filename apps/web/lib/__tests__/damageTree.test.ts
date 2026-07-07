import { describe, it, expect } from "vitest";
import { ALL_CHARACTERS } from "@genshin/data";
import { computeBuild } from "../calc.js";
import { explainFeature, elementFromFeature } from "../damageTree.js";
import type { BuildForm } from "../types.js";

const findChar = (key: string) => ALL_CHARACTERS.find((c) => c.name === key);

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

  it("clamps crit rate to the [0,1] range like the engine (crit_dmg_total residual guard)", () => {
    // crit_rate_total > 1 (e.g. from a scratch-dump build) must still clamp to 1
    // for the critAvg reconstruction, matching packages/core/src/compile/blocks.ts.
    const over = explainFeature({
      avg: 100,
      noncrit: 50,
      element: "physical",
      damageType: "normal",
      stats: { crit_rate_total: 1.5, crit_dmg_total: 1, dmg_all: 0, enemy_res_physical: 0 },
      enemy: { level: 90, resistance: 0 },
      charLevel: 90,
    });
    expect(over).not.toBeNull();
    const critNode = over!.nodes.find((n) => n.label === "Crit average")!;
    expect(critNode.factor).toBeCloseTo(1 + 1 * 1, 10); // rate clamped to 1, not 1.5

    const under = explainFeature({
      avg: 100,
      noncrit: 50,
      element: "physical",
      damageType: "normal",
      stats: { crit_rate_total: -0.5, crit_dmg_total: 1, dmg_all: 0, enemy_res_physical: 0 },
      enemy: { level: 90, resistance: 0 },
      charLevel: 90,
    });
    expect(under).not.toBeNull();
    const critNodeUnder = under!.nodes.find((n) => n.label === "Crit average")!;
    expect(critNodeUnder.factor).toBeCloseTo(1 + 0 * 1, 10); // rate clamped to 0, not -0.5
  });
});

describe("elementFromFeature", () => {
  it("reads Mona's normal_hit_1 element (hydro) straight from her feature data", () => {
    const mona = findChar("mona");
    expect(elementFromFeature(mona, "attack.normal_hit_1", undefined)).toBe("hydro");
  });

  it("reads Ganyu's Frostflake charged shot element (cryo) from her feature data", () => {
    const ganyu = findChar("ganyu");
    expect(elementFromFeature(ganyu, "attack.ganyu_frostflake", undefined)).toBe("cryo");
  });

  it("resolves Bennett's normal_hit_1 (no element field) to physical when unfused", () => {
    const bennett = findChar("bennett");
    expect(elementFromFeature(bennett, "attack.normal_hit_1", undefined)).toBe("physical");
  });

  it("prefers an active infusion for an elementless (physical-default) attack feature", () => {
    const bennett = findChar("bennett");
    expect(elementFromFeature(bennett, "attack.normal_hit_1", "pyro")).toBe("pyro");
  });

  it("returns null when the feature key can't be found on the character", () => {
    const mona = findChar("mona");
    expect(elementFromFeature(mona, "attack.does_not_exist", undefined)).toBeNull();
  });

  it("returns null when the character itself is not found (undefined char)", () => {
    expect(elementFromFeature(undefined, "attack.normal_hit_1", undefined)).toBeNull();
  });

  it("reads Ineffa's coordinated-attack skill feature (electro) from her element", () => {
    const ineffa = findChar("ineffa");
    expect(
      elementFromFeature(ineffa, "skill.ineffa_birgitta_coordinated_dmg", undefined)
    ).toBe("electro");
  });

  it("returns null for a stance-duplicated key whose matches disagree on element (Cyno)", () => {
    // Cyno's "attack.normal_hit_1" collides between his ground stance (no
    // element field -> physical) and his Pactsworn Pathclearer stance
    // (element: "electro") — resolveElement never evaluates conditions, so
    // an ambiguous key must resolve to null rather than guessing either.
    const cyno = findChar("cyno");
    expect(elementFromFeature(cyno, "attack.normal_hit_1", undefined)).toBeNull();
  });

  it("returns null for a heal-output row (Bennett burst.heal_dot)", () => {
    const bennett = findChar("bennett");
    expect(elementFromFeature(bennett, "burst.heal_dot", undefined)).toBeNull();
  });

  it("returns null for a static-output row (Bennett burst.atk_bonus)", () => {
    const bennett = findChar("bennett");
    expect(elementFromFeature(bennett, "burst.atk_bonus", undefined)).toBeNull();
  });
});
