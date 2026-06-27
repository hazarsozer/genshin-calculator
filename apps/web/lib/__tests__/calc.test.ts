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
