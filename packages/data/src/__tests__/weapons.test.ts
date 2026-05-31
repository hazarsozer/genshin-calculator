/**
 * P2.W0 — Weapon data shape tests.
 *
 * Verifies:
 *   1. DbObjectWeapon typechecks and is self-consistent (statTable reference, not re-port).
 *   2. ConditionStaticRefine (refine passive) resolves R1 vs R5 correctly via weapon_refine.
 *   3. ConditionBooleanRefine (toggle passive) activates only when its settings key is truthy.
 *   4. ConditionStacks (stack passive) returns correct stack count and per-rank stats.
 *   5. Barrel export (weapons/index.ts) re-exports all three exemplars correctly.
 *
 * Weapons under test:
 *   - WolfsGravestone (claymore, 5★): ConditionStaticRefine (always-on refine passive) +
 *                                      ConditionBooleanRefine (toggleable refine-scaled passive).
 *   - TheCatch     (polearm, 4★):     ConditionStaticRefine only (pure refine passive).
 *   - LostPrayer  (catalyst, 5★):     ConditionStacks with per-rank refine-indexed stats.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Claymore/WolfsGravestone.js
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/Catch.js
 *   raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/LostPrayer.js
 */

import { describe, it, expect } from "vitest";
import { evaluate, getStackCount } from "@genshin/core";
import type { ConditionStaticRefine, ConditionBooleanRefine, ConditionStacks } from "@genshin/types";

// Barrel import smoke test — verifies weapons/index.ts re-exports all exemplars.
import * as weaponBarrel from "../weapons/index.js";

import { wolfsGravestone } from "../weapons/wolfs-gravestone.js";
import { theCatch } from "../weapons/the-catch.js";
import { lostPrayer } from "../weapons/lost-prayer.js";

// ---------------------------------------------------------------------------
// Barrel export smoke test
// ---------------------------------------------------------------------------

describe("weapons barrel (weapons/index.ts)", () => {
  it("exports wolfsGravestone", () => {
    expect(weaponBarrel.wolfsGravestone).toBeDefined();
    expect(weaponBarrel.wolfsGravestone.name).toBe("wolfs_gravestone");
  });

  it("exports theCatch", () => {
    expect(weaponBarrel.theCatch).toBeDefined();
    expect(weaponBarrel.theCatch.name).toBe("the_catch");
  });

  it("exports lostPrayer", () => {
    expect(weaponBarrel.lostPrayer).toBeDefined();
    expect(weaponBarrel.lostPrayer.name).toBe("lost_prayer_to_the_sacred_winds");
  });
});

// ---------------------------------------------------------------------------
// WolfsGravestone
// ---------------------------------------------------------------------------

describe("WolfsGravestone", () => {
  const conds = wolfsGravestone.conditions!;
  const cond0 = conds[0] as ConditionStaticRefine;
  const cond1 = conds[1] as ConditionBooleanRefine;

  it("has expected metadata", () => {
    expect(wolfsGravestone.name).toBe("wolfs_gravestone");
    expect(wolfsGravestone.rarity).toBe(5);
    expect(wolfsGravestone.weapon).toBe("claymore");
    expect(wolfsGravestone.gameId).toBe(12502);
  });

  it("references its generated stat table (non-empty)", () => {
    // Must reference, not re-port. We verify the table is non-empty
    // and has the expected stat key from the generated table.
    expect(wolfsGravestone.statTable.length).toBeGreaterThan(0);
    const statKeys = wolfsGravestone.statTable.map((e) => e.getName());
    expect(statKeys).toContain("atk_base");
  });

  it("has two conditions", () => {
    expect(conds).toHaveLength(2);
  });

  describe("condition[0] — ConditionStaticRefine (always-on passive)", () => {
    it("is type 'refine'", () => {
      expect(cond0.type).toBe("refine");
    });

    it("is always active (static semantics)", () => {
      // ConditionStaticRefine inherits static evaluation — always active unless gated.
      expect(evaluate(cond0, { weapon_refine: 1 })).toBe(true);
      expect(evaluate(cond0, { weapon_refine: 5 })).toBe(true);
    });

    it("refinementStats[0] = R1: atk_percent 20", () => {
      expect(cond0.refinementStats![0]).toEqual({ atk_percent: 20 });
    });

    it("refinementStats[4] = R5: atk_percent 40", () => {
      expect(cond0.refinementStats![4]).toEqual({ atk_percent: 40 });
    });

    it("resolves correct per-rank value via weapon_refine", () => {
      // Simulate engine: read refinementStats[weapon_refine - 1]
      const r1 = cond0.refinementStats![1 - 1]!.atk_percent;
      const r5 = cond0.refinementStats![5 - 1]!.atk_percent;
      expect(r1).toBe(20);
      expect(r5).toBe(40);
    });
  });

  describe("condition[1] — ConditionBooleanRefine (toggle passive, refine-scaled)", () => {
    it("is type 'boolean-refine'", () => {
      expect(cond1.type).toBe("boolean-refine");
    });

    it("name is 'weapon_wolfs_gravestone'", () => {
      expect(cond1.name).toBe("weapon_wolfs_gravestone");
    });

    it("is inactive when key is 0", () => {
      expect(evaluate(cond1, { weapon_wolfs_gravestone: 0, weapon_refine: 1 })).toBe(false);
    });

    it("is active when key is 1", () => {
      expect(evaluate(cond1, { weapon_wolfs_gravestone: 1, weapon_refine: 1 })).toBe(true);
    });

    it("refinementStats resolves R1: atk_percent 40", () => {
      // WolfsGravestone toggle gives atk_percent 40/50/60/70/80 at R1..R5.
      expect(cond1.refinementStats![0]).toEqual({ atk_percent: 40 });
    });

    it("refinementStats resolves R5: atk_percent 80", () => {
      expect(cond1.refinementStats![4]).toEqual({ atk_percent: 80 });
    });
  });
});

// ---------------------------------------------------------------------------
// The Catch — pure ConditionStaticRefine (no toggle)
// ---------------------------------------------------------------------------

describe("TheCatch", () => {
  const cond0 = theCatch.conditions![0] as ConditionStaticRefine;

  it("has expected metadata", () => {
    expect(theCatch.name).toBe("the_catch");
    expect(theCatch.rarity).toBe(4);
    expect(theCatch.weapon).toBe("polearm");
    expect(theCatch.gameId).toBe(13415);
  });

  it("references its generated stat table", () => {
    expect(theCatch.statTable.length).toBeGreaterThan(0);
    const statKeys = theCatch.statTable.map((e) => e.getName());
    expect(statKeys).toContain("atk_base");
  });

  it("has one condition (pure refine passive)", () => {
    expect(theCatch.conditions).toHaveLength(1);
    expect(cond0.type).toBe("refine");
  });

  it("is always active", () => {
    expect(evaluate(cond0, { weapon_refine: 3 })).toBe(true);
  });

  it("refinementStats R1: dmg_burst 16, crit_rate_burst 6", () => {
    expect(cond0.refinementStats![0]).toEqual({ dmg_burst: 16, crit_rate_burst: 6 });
  });

  it("refinementStats R5: dmg_burst 32, crit_rate_burst 12", () => {
    expect(cond0.refinementStats![4]).toEqual({ dmg_burst: 32, crit_rate_burst: 12 });
  });
});

// ---------------------------------------------------------------------------
// Lost Prayer — ConditionStacks with per-rank refine-indexed stats
// ---------------------------------------------------------------------------

describe("LostPrayer", () => {
  const cond0 = lostPrayer.conditions![0] as ConditionStacks;

  it("has expected metadata", () => {
    expect(lostPrayer.name).toBe("lost_prayer_to_the_sacred_winds");
    expect(lostPrayer.rarity).toBe(5);
    expect(lostPrayer.weapon).toBe("catalyst");
    expect(lostPrayer.gameId).toBe(14502);
  });

  it("references its generated stat table", () => {
    expect(lostPrayer.statTable.length).toBeGreaterThan(0);
    const statKeys = lostPrayer.statTable.map((e) => e.getName());
    expect(statKeys).toContain("atk_base");
  });

  it("has one condition of type 'stacks'", () => {
    expect(lostPrayer.conditions).toHaveLength(1);
    expect(cond0.type).toBe("stacks");
  });

  it("name is 'weapon_lost_prayer'", () => {
    expect(cond0.name).toBe("weapon_lost_prayer");
  });

  it("maxStacks is 4", () => {
    expect(cond0.maxStacks).toBe(4);
  });

  it("is inactive when stack count is 0", () => {
    expect(evaluate(cond0, { weapon_lost_prayer: 0, weapon_refine: 1 })).toBe(false);
  });

  it("is active when stack count > 0", () => {
    expect(evaluate(cond0, { weapon_lost_prayer: 2, weapon_refine: 1 })).toBe(true);
  });

  it("getStackCount returns 2 stacks", () => {
    expect(getStackCount(cond0, { weapon_lost_prayer: 2, weapon_refine: 1 })).toBe(2);
  });

  it("getStackCount clamps to maxStacks (4)", () => {
    expect(getStackCount(cond0, { weapon_lost_prayer: 9, weapon_refine: 1 })).toBe(4);
  });

  it("refinementStats[0] = R1: all elemental dmg 8%", () => {
    const r1 = cond0.refinementStats![0]!;
    // Source: LostPrayer.js — [dmg_anemo, dmg_geo, dmg_pyro, dmg_electro, dmg_hydro, dmg_cryo, dmg_dendro] = 8 at R1
    expect(r1.dmg_anemo).toBe(8);
    expect(r1.dmg_pyro).toBe(8);
  });

  it("refinementStats[4] = R5: all elemental dmg 16%", () => {
    const r5 = cond0.refinementStats![4]!;
    expect(r5.dmg_anemo).toBe(16);
    expect(r5.dmg_pyro).toBe(16);
  });
});
