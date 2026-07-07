import { describe, it, expect } from "vitest";
import { foodTables } from "@genshin/data";
import { rankFood } from "../foodRanking.js";
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

// Hu Tao / Staff of Homa with an explicitly pinned ATK-scaling feature — the
// DEFAULT_FORM's own headline (Bennett) happens to land on a flat, level-scaled
// reaction feature, which is a legitimate but useless test signal for "does food
// move the headline." Pinning `burst.burst_dmg` makes the ATK/crit sensitivity
// deterministic while still exercising rankFood's real headline-selection path.
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
  manualStats: SAMPLE_BLOCK,
  manualSets: [],
  pinnedFeature: "burst.burst_dmg",
};

describe("rankFood", () => {
  it("sorts rows descending by average damage", () => {
    const rows = rankFood(DEFAULT_FORM, "Attack", false);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].triple[2]).toBeGreaterThanOrEqual(rows[i].triple[2]);
    }
  });

  it("gives a positive deltaAvg for a real ATK+crit dish vs the no-food baseline", () => {
    const rows = rankFood(huTaoForm, "Attack", false);
    const row = rows.find((r) => r.key === "AdeptusTemptation");
    expect(row).toBeDefined();
    expect(row!.tier).toBe(row!.maxTier);
    expect(row!.deltaAvg).toBeGreaterThan(0);
  });

  it("marks the equipped dish/tier row with equipped:true and deltaAvg exactly 0", () => {
    const maxTier = foodTables.Attack.AdeptusTemptation.stats.atk.length;
    const equippedForm: BuildForm = {
      ...huTaoForm,
      food: { Attack: { key: "AdeptusTemptation", tier: maxTier } },
    };
    const rows = rankFood(equippedForm, "Attack", false);
    const row = rows.find((r) => r.key === "AdeptusTemptation" && r.tier === maxTier);
    expect(row).toBeDefined();
    expect(row!.equipped).toBe(true);
    expect(row!.deltaAvg).toBe(0);

    // every other row must NOT be marked equipped
    for (const r of rows) {
      if (r.key !== "AdeptusTemptation" || r.tier !== maxTier) {
        expect(r.equipped).toBe(false);
      }
    }
  });

  it("allTiers=false yields one row per dish (+ possible extra equipped row); allTiers=true yields strictly more", () => {
    const dishCount = Object.keys(foodTables.Attack).length;

    const collapsed = rankFood(DEFAULT_FORM, "Attack", false);
    expect(collapsed.length).toBe(dishCount); // no food equipped -> no extra row

    const expanded = rankFood(DEFAULT_FORM, "Attack", true);
    expect(expanded.length).toBeGreaterThan(collapsed.length);

    // equipping a dish at a NON-max tier should add exactly one extra row under allTiers=false
    const lowTierForm: BuildForm = {
      ...DEFAULT_FORM,
      food: { Attack: { key: "AdeptusTemptation", tier: 1 } },
    };
    const withEquippedLowTier = rankFood(lowTierForm, "Attack", false);
    const maxTier = foodTables.Attack.AdeptusTemptation.stats.atk.length;
    if (maxTier > 1) {
      expect(withEquippedLowTier.length).toBe(dishCount + 1);
      const equippedRow = withEquippedLowTier.find(
        (r) => r.key === "AdeptusTemptation" && r.tier === 1
      );
      expect(equippedRow).toBeDefined();
      expect(equippedRow!.equipped).toBe(true);
      expect(equippedRow!.deltaAvg).toBe(0);
    }
  });

  it("Potion category: every row's tier is <= its dish's max tier", () => {
    const rows = rankFood(DEFAULT_FORM, "Potion", true);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.tier).toBeLessThanOrEqual(row.maxTier);
      expect(row.tier).toBeGreaterThanOrEqual(1);
    }
  });

  it("statPills reflect getFoodStats at the row's tier", () => {
    const rows = rankFood(DEFAULT_FORM, "Attack", false);
    const row = rows.find((r) => r.key === "AdeptusTemptation")!;
    const statKeys = row.statPills.map((p) => p.stat).sort();
    expect(statKeys).toEqual(["atk", "crit_rate"]);
  });
});
