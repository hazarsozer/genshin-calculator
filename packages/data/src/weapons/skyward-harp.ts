/**
 * Skyward Harp — 5★ Bow (hand-port; weapon FeatureDamage).
 *
 * Passive "Echoing Ballad":
 *   - Always-on: CRIT DMG +20/25/30/35/40% (ConditionStaticRefine, refine-scaled).
 *   - Proc: deals Physical AoE = 125% of ATK (CONSTANT across all refines).
 *     Raw StatTable key: 'skyward_harp_aoe', values: [125] (1 element → constant).
 *     Fixture key: weapon.skyward_harp_aoe.
 *     r1 normal = r5 normal = 1297.9 → constant confirmed.
 *
 * The second raw ConditionStaticRefine (title/description same, stats:
 *   text_percent_chance/text_percent_dmg/text_decimal_cd) is entirely UI markers →
 *   dropped per brief (OMIT all text_* stats; a condition whose only stats are text_*
 *   is entirely UI → drop the whole condition).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/SkywardHarp.js
 *   tests/golden/fixtures/weapons-r1/skyward_harp.json
 *   tests/golden/fixtures/weapons-r5/skyward_harp.json
 */

import type {
  ConditionStaticRefine,
  DbObjectWeapon,
  Feature,
  TalentTable,
} from "@genshin/types";
import { SkywardHarpStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Always-on: CRIT DMG +20/25/30/35/40% (SkywardHarp.js:14-19).
const critDmgPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_skyward_harp",
  description: "talent_descr.bonus_crit_dmg",
  refinementStats: [
    { crit_dmg: 20 }, // R1
    { crit_dmg: 25 }, // R2
    { crit_dmg: 30 }, // R3
    { crit_dmg: 35 }, // R4
    { crit_dmg: 40 }, // R5
  ],
};

// Physical AoE proc: 125% of ATK, CONSTANT (raw StatTable has 1 value).
// Fixture: weapon.skyward_harp_aoe, r1 normal=1297.9, r5 normal=1297.9 (identical).
const aoeProc: Feature = {
  name: "skyward_harp_aoe",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([125]),
    },
  ],
};

export const skywardHarp: DbObjectWeapon = {
  name: "skyward_harp",
  serializeId: 37,
  gameId: 15501,
  rarity: 5,
  weapon: "bow",
  statTable: SkywardHarpStatTable,
  conditions: [critDmgPassive],
  features: [aoeProc],
};
