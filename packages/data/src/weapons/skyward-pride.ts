/**
 * Skyward Pride — 5★ Claymore (hand-port; weapon FeatureDamage).
 *
 * Passive "Sky-ripping Dragon Spine":
 *   - Always-on: All DMG +8/10/12/14/16% (ConditionStaticRefine, refine-scaled).
 *   - Proc: Physical Vacuum Blade = 80/100/120/140/160% of ATK (REFINE-SCALED).
 *     Raw StatTable key: 'skyward_pride_vacuum_blade'.
 *     Fixture: weapon.skyward_pride_vacuum_blade.
 *     r1 normal=898.0, r5 normal=1924.2 → scaled (not identical → refine-scaled).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Claymore/SkywardPride.js
 *   tests/golden/fixtures/weapons-r1/skyward_pride.json
 *   tests/golden/fixtures/weapons-r5/skyward_pride.json
 */

import type {
  ConditionStaticRefine,
  DbObjectWeapon,
  Feature,
  TalentTable,
} from "@genshin/types";
import { SkywardPrideStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Always-on: All DMG +8/10/12/14/16% (SkywardPride.js:14-19).
const dmgAllPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_skyward_pride",
  description: "talent_descr.weapon_skyward_pride",
  refinementStats: [
    { dmg_all: 8 },  // R1
    { dmg_all: 10 }, // R2
    { dmg_all: 12 }, // R3
    { dmg_all: 14 }, // R4
    { dmg_all: 16 }, // R5
  ],
};

// Physical Vacuum Blade proc: 80/100/120/140/160% of ATK, REFINE-SCALED.
// Fixture: weapon.skyward_pride_vacuum_blade, r1 normal=898.0, r5 normal=1924.2.
const vacuumBladeProc: Feature = {
  name: "skyward_pride_vacuum_blade",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([80, 100, 120, 140, 160]),
    },
  ],
};

export const skywardPride: DbObjectWeapon = {
  name: "skyward_pride",
  serializeId: 62,
  gameId: 12501,
  rarity: 5,
  weapon: "claymore",
  statTable: SkywardPrideStatTable,
  conditions: [dmgAllPassive],
  features: [vacuumBladeProc],
};
