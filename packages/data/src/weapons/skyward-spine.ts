/**
 * Skyward Spine — 5★ Polearm (hand-port; weapon FeatureDamage).
 *
 * Passive "Skypiercing Point":
 *   - Always-on: CRIT Rate +8/10/12/14/16%, Normal ATK Speed +12% (both from first
 *     ConditionStaticRefine; crit_rate is refine-scaled, atk_speed_normal is constant
 *     [single-element StatTable → same value at all refines]).
 *   - The second raw ConditionStaticRefine has only `text_percent` [40,55,70,85,100]
 *     (UI marker for proc chance) → entirely UI → dropped per brief.
 *   - Proc: Physical Vacuum Blade = 40/55/70/85/100% of ATK (REFINE-SCALED).
 *     Raw StatTable key: 'skyward_pride_vacuum_blade' (raw reuses Pride's key name —
 *     Spine and Pride share the same proc key in the fixture).
 *     Fixture: weapon.skyward_pride_vacuum_blade.
 *     r1 normal=364.9, r5 normal=912.2 → scaled (not identical → refine-scaled).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/SkywardSpine.js
 *   tests/golden/fixtures/weapons-r1/skyward_spine.json
 *   tests/golden/fixtures/weapons-r5/skyward_spine.json
 */

import type {
  ConditionStaticRefine,
  DbObjectWeapon,
  Feature,
  TalentTable,
} from "@genshin/types";
import { SkywardSpineStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Always-on: CRIT Rate +8/10/12/14/16%, Normal ATK Speed +12% (SkywardSpine.js:14-23).
// atk_speed_normal has a single-element StatTable [12] → constant at all refines.
const statPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_skyward_spine",
  description: "talent_descr.weapon_skyward_spine",
  refinementStats: [
    { crit_rate: 8,  atk_speed_normal: 12 }, // R1
    { crit_rate: 10, atk_speed_normal: 12 }, // R2
    { crit_rate: 12, atk_speed_normal: 12 }, // R3
    { crit_rate: 14, atk_speed_normal: 12 }, // R4
    { crit_rate: 16, atk_speed_normal: 12 }, // R5
  ],
};

// Physical Vacuum Blade proc: 40/55/70/85/100% of ATK, REFINE-SCALED.
// Raw reuses StatTable key 'skyward_pride_vacuum_blade' → fixture key is
// weapon.skyward_pride_vacuum_blade. r1 normal=364.9, r5 normal=912.2.
const vacuumBladeProc: Feature = {
  name: "skyward_pride_vacuum_blade",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([40, 55, 70, 85, 100]),
    },
  ],
};

export const skywardSpine: DbObjectWeapon = {
  name: "skyward_spine",
  serializeId: 95,
  gameId: 13502,
  rarity: 5,
  weapon: "polearm",
  statTable: SkywardSpineStatTable,
  conditions: [statPassive],
  features: [vacuumBladeProc],
};
