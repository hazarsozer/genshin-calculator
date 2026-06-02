/**
 * hunters_path — 5★ Bow (NOVEL hand-port; weapon FeatureMultiplier consumer).
 *
 * Passive "At the End of the Beast Paths":
 *   - Always-on: All Elemental DMG Bonus +12/15/18/21/24% (ConditionStaticRefine).
 *   - Toggle: Charged Attack DMG += 160/200/240/280/320% of Elemental Mastery
 *     when "weapon_hunters_path" is active (ConditionBooleanRefine gate; the refine
 *     values are text_percent only → the condition itself carries no real stats;
 *     the CharMultiplier carries the damage contribution).
 *
 * Modelled as a single `CharMultiplier`: `scaling: "mastery*"` (EM total —
 * `mastery*` → `mastery_total` in buildStats, the flat-sum EM), `leveling:
 * "weapon_refine"` with a refine-indexed table [160,200,240,280,320] (compileFeature
 * divides by 100), `target.damageTypes: ["charged"]`, `condition: { type:"boolean",
 * name:"weapon_hunters_path" }` (the toggle gate).
 *
 * DELIBERATELY OMITTED — ConditionBooleanRefine stats `text_percent` [160..320]:
 * these are UI display markers only, not in any buildStats emit list → numeric no-ops.
 *
 * serializeId: 125 (raw DbObjectWeapon.serializeId).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/HuntersPath.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (scaling 'mastery*' → makeStatTotalItem('mastery'))
 */

import type {
  CharMultiplier,
  ConditionStaticRefine,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { HuntersPathStatTable } from "../generated/weaponStatTables.js";

/**
 * A refine-indexed multiplier table. `getValue(refine)` is 1-indexed (R1 → values[0]),
 * mirroring her `ValueTable.getValue(weapon_refine)`. compileFeature divides by 100.
 */
function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

// Always-on: All Elemental DMG Bonus +12/15/18/21/24% (HuntersPath.js:20-32).
const elementalDmgPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.at_the_end_of_the_beast_paths",
  description: "talent_descr.at_the_end_of_the_beast_paths_1",
  refinementStats: [
    { dmg_anemo: 12, dmg_geo: 12, dmg_pyro: 12, dmg_electro: 12, dmg_hydro: 12, dmg_cryo: 12, dmg_dendro: 12 }, // R1
    { dmg_anemo: 15, dmg_geo: 15, dmg_pyro: 15, dmg_electro: 15, dmg_hydro: 15, dmg_cryo: 15, dmg_dendro: 15 }, // R2
    { dmg_anemo: 18, dmg_geo: 18, dmg_pyro: 18, dmg_electro: 18, dmg_hydro: 18, dmg_cryo: 18, dmg_dendro: 18 }, // R3
    { dmg_anemo: 21, dmg_geo: 21, dmg_pyro: 21, dmg_electro: 21, dmg_hydro: 21, dmg_cryo: 21, dmg_dendro: 21 }, // R4
    { dmg_anemo: 24, dmg_geo: 24, dmg_pyro: 24, dmg_electro: 24, dmg_hydro: 24, dmg_cryo: 24, dmg_dendro: 24 }, // R5
  ],
};

// Charged Attack DMG += 160/200/240/280/320% of Elemental Mastery (HuntersPath.js:43-54).
// Gated by the "weapon_hunters_path" boolean toggle.
const masteryToCharged: CharMultiplier = {
  scaling: "mastery*",
  source: "weapon",
  leveling: "weapon_refine",
  values: refineValueTable([160, 200, 240, 280, 320]),
  condition: { type: "boolean", name: "weapon_hunters_path" },
  target: { damageTypes: ["charged"] },
};

export const huntersPath: DbObjectWeapon = {
  name: "hunters_path",
  serializeId: 125,
  gameId: 15511,
  rarity: 5,
  weapon: "bow",
  statTable: HuntersPathStatTable,
  conditions: [elementalDmgPassive],
  multipliers: [masteryToCharged],
};
