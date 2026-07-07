import { describe, it, expect } from "vitest";
import { TOLERANCE } from "@genshin/data";
import { computeBuild } from "../calc.js";
import type { BuildForm } from "../types.js";

/**
 * Golden-anchor test for the compute adapter.
 *
 * This pins `computeBuild` against a real oracle fixture: `tests/golden/fixtures/
 * toggles/bennett.json`. That fixture is produced by the engine via the SAME
 * `reconstructPort` reconstruction goldenConfig.test.ts drives, so reproducing the
 * fixture's exact build in a `BuildForm` and asserting a feature triple matches
 * proves the browser wrapper (object discovery + BuildForm → reconstructPort
 * mapping + DamageResult → triple shape) is faithful. The engine math itself is
 * already golden — this test only guards the adapter.
 *
 * The `toggles/bennett` build (tests/golden/fixtures/toggles/_manifest.json):
 *   char Bennett, C0, Lv90 / A6;  weapon the_alley_flash, R1, Lv90;
 *   charToggle `bennet_fantastic_voyage` ON;  statBlock "sampleStats" (SAMPLE_BLOCK);
 *   enemy 90/10;  talents 10/10/10;  no artifact sets, no weapon passive.
 *
 * `the_alley_flash`'s `statTable` is the SAME generated `AlleyFlashStatTable` object
 * the golden harness resolves for a sword (WEAPON_TABLE_BY_TYPE.sword), so the
 * reconstructed build matches the oracle to within TOLERANCE (0.1).
 */

// SAMPLE_BLOCK — copied verbatim from packages/data/src/__tests__/_statBlocks.ts
// (not exported from @genshin/data's index; inlined to keep apps/web self-contained).
// statBlock is assembled upstream by the form layer, so computeBuild takes it as an arg.
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

// Pinned from tests/golden/fixtures/toggles/bennett.json → features["attack.normal_hit_1"].
const ORACLE_NORMAL_HIT_1 = {
  normal: 1633.5472368810547,
  crit: 3267.0944737621094,
  average: 1796.90196056916,
} as const;

describe("computeBuild anchor", () => {
  it("reproduces the golden Bennett attack.normal_hit_1 triple", () => {
    const { features, error } = computeBuild(bennettTogglesForm, SAMPLE_BLOCK, []);
    expect(error).toBeUndefined();

    const f = features.find((x) => x.key === "attack.normal_hit_1");
    expect(f).toBeDefined();

    // [non-crit, crit, average] — each within the golden TOLERANCE (0.1).
    expect(Math.abs(f!.triple[0] - ORACLE_NORMAL_HIT_1.normal)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(f!.triple[1] - ORACLE_NORMAL_HIT_1.crit)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(f!.triple[2] - ORACLE_NORMAL_HIT_1.average)).toBeLessThanOrEqual(TOLERANCE);
  });

  it("humanizes the feature key into a label", () => {
    const { features } = computeBuild(bennettTogglesForm, SAMPLE_BLOCK, []);
    const f = features.find((x) => x.key === "attack.normal_hit_1");
    expect(f!.label).toBe("Attack Normal Hit 1");
  });

  it("returns an error and no features for an unknown character/weapon", () => {
    const bad: BuildForm = { ...bennettTogglesForm, characterKey: "not_a_character" };
    const { features, error } = computeBuild(bad, SAMPLE_BLOCK, []);
    expect(error).toBeDefined();
    expect(features).toEqual([]);
  });

  it("surfaces final stats for the stat strip", () => {
    const result = computeBuild(bennettTogglesForm, SAMPLE_BLOCK, []);
    expect(result.stats).toBeDefined();
    expect(result.stats!.atk_total).toBeGreaterThan(0);
    expect(result.stats!.crit_rate_total).toBeGreaterThanOrEqual(0);
  });
});

// Hu Tao (pyro) + Staff of Homa — used to verify the reaction override
// (settings.reaction) flows through computeBuild into the engine's
// AMPLIFYING_VARIANT policy (packages/data/src/compileFeature.ts:97).
const huTaoForm: BuildForm = {
  characterKey: "hu_tao",
  weaponKey: "staff_of_homa",
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
  talents: { attack: 10, elemental: 10, burst: 10 },
  constellation: 0,
  weaponRefine: 1,
  conditions: { toggles: {}, stacks: {} },
  enemy: { level: 90, resistance: 10 },
  artifactMode: "manual",
  goodJson: "",
  manualStats: {},
  manualSets: [],
};

// Amplifying-reaction multiplier is `baseMultiplier × (1 + 2.78·EM/(EM+1400) + …)`
// (packages/core/src/reactions/amplifying.ts) — SAMPLE_BLOCK's mastery_base:55
// contributes a non-zero EM bonus, so isolating the exact ×1.5/×2.0 base-multiplier
// ratio needs EM at 0. Everything else matches SAMPLE_BLOCK.
const NO_MASTERY_BLOCK: Record<string, number> = { ...SAMPLE_BLOCK, mastery_base: 0 };

describe("computeBuild — reaction override", () => {
  function avgOf(form: BuildForm, key: string, block: Record<string, number> = SAMPLE_BLOCK): number {
    const { features, error } = computeBuild(form, block, []);
    expect(error).toBeUndefined();
    const f = features.find((x) => x.key === key);
    expect(f).toBeDefined();
    return f!.triple[2];
  }

  it("amplifies a pyro burst feature ×1.5 under reaction:vaporize (reverse vaporize, EM=0)", () => {
    const baseline = avgOf(huTaoForm, "burst.burst_dmg", NO_MASTERY_BLOCK);
    const vaporized = avgOf(
      { ...huTaoForm, conditions: { toggles: {}, stacks: {}, reaction: "vaporize" } },
      "burst.burst_dmg",
      NO_MASTERY_BLOCK
    );
    expect(Math.abs(vaporized / baseline - 1.5)).toBeLessThanOrEqual(1.5e-6);
  });

  it("amplifies a pyro burst feature by the exact EM-bonus ratio under reaction:vaporize (SAMPLE_BLOCK, real mastery)", () => {
    const built = computeBuild(huTaoForm, SAMPLE_BLOCK, []);
    expect(built.error).toBeUndefined();
    const mastery = built.stats!.mastery;

    const baseline = avgOf(huTaoForm, "burst.burst_dmg");
    const vaporized = avgOf(
      { ...huTaoForm, conditions: { toggles: {}, stacks: {}, reaction: "vaporize" } },
      "burst.burst_dmg"
    );
    const expectedRatio = 1.5 * (1 + (2.78 * mastery) / (mastery + 1400));
    const actualRatio = vaporized / baseline;
    expect(Math.abs(actualRatio / expectedRatio - 1)).toBeLessThanOrEqual(1e-6);
  });

  it("leaves an un-infused physical normal hit unchanged under reaction:vaporize", () => {
    const baseline = avgOf(huTaoForm, "attack.normal_hit_1");
    const vaporized = avgOf(
      { ...huTaoForm, conditions: { toggles: {}, stacks: {}, reaction: "vaporize" } },
      "attack.normal_hit_1"
    );
    expect(vaporized).toBe(baseline);
  });
});

describe("computeBuild — party", () => {
  function normalHit(form: BuildForm) {
    const { features, error } = computeBuild(form, SAMPLE_BLOCK, []);
    expect(error).toBeUndefined();
    return features.find((x) => x.key === "attack.normal_hit_1")!.triple[0];
  }

  it("an empty roster is inert (identical to no party)", () => {
    const baseline = normalHit(bennettTogglesForm);
    const emptyParty = normalHit({ ...bennettTogglesForm, party: { members: [] } });
    expect(emptyParty).toBe(baseline);
  });

  it("a Zhongli teammate (universal res shred) raises every hit", () => {
    const baseline = normalHit(bennettTogglesForm);
    const withZhongli = normalHit({
      ...bennettTogglesForm,
      party: { members: [{ slug: "zhongli", settings: { "party.zhongli_jade_shield": true } }] },
    });
    expect(withZhongli).toBeGreaterThan(baseline);
  });

  it("a teammate's Viridescent Venerer(pyro) pick shreds enemy Pyro RES (raises a pyro hit), reverting when removed", () => {
    // Active Bennett (pyro); skill.press_dmg is a Pyro instance → benefits from enemy_res_pyro −40.
    const pyroSkill = (form: BuildForm) => {
      const { features, error } = computeBuild(form, SAMPLE_BLOCK, []);
      expect(error).toBeUndefined();
      return features.find((x) => x.key === "skill.press_dmg")!.triple[0];
    };
    const noPick: BuildForm = {
      ...bennettTogglesForm,
      party: { members: [{ slug: "sucrose", settings: {} }] },
    };
    const withVV: BuildForm = {
      ...bennettTogglesForm,
      party: {
        members: [
          { slug: "sucrose", settings: {}, setKey: "viridescent_venerer_4", setElement: "pyro" },
        ],
      },
    };
    const baseline = pyroSkill(noPick);
    expect(pyroSkill(withVV)).toBeGreaterThan(baseline); // VV(pyro) shred applied via the set_other string lane
    expect(pyroSkill(noPick)).toBe(baseline); // removing the pick reverts exactly (lane omitted)
  });

  it("a Bennett teammate's ATK battery raises the active character's ATK (explicit stat field)", () => {
    const withStat = computeBuild(
      {
        ...bennettTogglesForm,
        characterKey: "xiangling", // active char ≠ the Bennett teammate
        party: {
          members: [
            { slug: "bennett", settings: { bennet_atk_base: 800, "party.bennet_fantastic_voyage": true } },
          ],
        },
      },
      SAMPLE_BLOCK,
      []
    );
    const withZeroStat = computeBuild(
      {
        ...bennettTogglesForm,
        characterKey: "xiangling",
        party: {
          members: [
            { slug: "bennett", settings: { bennet_atk_base: 0, "party.bennet_fantastic_voyage": true } },
          ],
        },
      },
      SAMPLE_BLOCK,
      []
    );
    expect(withStat.error).toBeUndefined();
    expect(withZeroStat.error).toBeUndefined();
    expect(withStat.stats!.atk_total).toBeGreaterThan(withZeroStat.stats!.atk_total);
  });
});
