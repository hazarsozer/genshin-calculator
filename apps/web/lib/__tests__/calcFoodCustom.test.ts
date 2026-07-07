import { describe, it, expect } from "vitest";
import { computeBuild, foodBagFromForm } from "../calc.js";
import { encodeBuild, decodeBuild } from "../url.js";
import { DEFAULT_FORM } from "../defaults.js";
import type { BuildForm } from "../types.js";

// SAMPLE_BLOCK — copied verbatim from packages/data/src/__tests__/_statBlocks.ts
// (not exported from @genshin/data's index; inlined per lib/__tests__/calc.test.ts precedent).
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

describe("foodBagFromForm", () => {
  it("returns the tier-3 AdeptusTemptation stats for a single equipped slot", () => {
    expect(foodBagFromForm({ Attack: { key: "AdeptusTemptation", tier: 3 } })).toEqual({
      atk: 372,
      crit_rate: 12,
    });
  });

  it("sums two slots, merging overlapping keys", () => {
    const bag = foodBagFromForm({
      Attack: { key: "AdeptusTemptation", tier: 3 }, // atk 372, crit_rate 12
      Defence: { key: "ButterCrab", tier: 3 }, // any Defence dish; just asserts additive merge below
    });
    // AdeptusTemptation's contribution must survive additive merge with a second slot.
    expect(bag.atk).toBe(372);
    expect(bag.crit_rate).toBe(12);
  });

  it("returns {} for undefined or an empty food map", () => {
    expect(foodBagFromForm(undefined)).toEqual({});
    expect(foodBagFromForm({})).toEqual({});
  });
});

describe("computeBuild — customBuffs settings", () => {
  it("raises atk_total when customBuffs.atk is set", () => {
    const without = computeBuild(huTaoForm, SAMPLE_BLOCK, []);
    const withBuff = computeBuild({ ...huTaoForm, customBuffs: { atk: 100 } }, SAMPLE_BLOCK, []);
    expect(without.error).toBeUndefined();
    expect(withBuff.error).toBeUndefined();
    expect(withBuff.stats!.atk_total).toBeGreaterThan(without.stats!.atk_total!);
  });

  it("raises a pyro feature average when customBuffs.dmg_pyro is set", () => {
    const key = "burst.burst_dmg";
    const without = computeBuild(huTaoForm, SAMPLE_BLOCK, []);
    const withBuff = computeBuild({ ...huTaoForm, customBuffs: { dmg_pyro: 20 } }, SAMPLE_BLOCK, []);
    expect(without.error).toBeUndefined();
    expect(withBuff.error).toBeUndefined();
    const before = without.features.find((f) => f.key === key)!.triple[2];
    const after = withBuff.features.find((f) => f.key === key)!.triple[2];
    expect(after).toBeGreaterThan(before);
  });
});

describe("computeBuild — food settings", () => {
  it("raises atk_total when a food slot is equipped", () => {
    const without = computeBuild(huTaoForm, SAMPLE_BLOCK, []);
    const withFood = computeBuild(
      { ...huTaoForm, food: { Attack: { key: "AdeptusTemptation", tier: 3 } } },
      SAMPLE_BLOCK,
      []
    );
    expect(without.error).toBeUndefined();
    expect(withFood.error).toBeUndefined();
    expect(withFood.stats!.atk_total).toBeGreaterThan(without.stats!.atk_total!);
  });
});

describe("hash round-trip — food + customBuffs", () => {
  it("preserves both optional fields through encode/decode", () => {
    const form: BuildForm = {
      ...DEFAULT_FORM,
      food: { Attack: { key: "AdeptusTemptation", tier: 3 } },
      customBuffs: { atk: 100, dmg_pyro: 20 },
    };
    const decoded = decodeBuild(encodeBuild(form));
    expect(decoded.food).toEqual(form.food);
    expect(decoded.customBuffs).toEqual(form.customBuffs);
  });

  it("decodes a hash of a form without them to undefined for both", () => {
    const decoded = decodeBuild(encodeBuild(DEFAULT_FORM));
    expect(decoded.food).toBeUndefined();
    expect(decoded.customBuffs).toBeUndefined();
  });
});
