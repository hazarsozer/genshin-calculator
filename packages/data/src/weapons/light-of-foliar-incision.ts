/**
 * light_of_foliar_incision — 5★ Sword (NOVEL hand-port; weapon FeatureMultiplier consumer).
 *
 * Passive "Auspice Jade":
 *   - Always-on (ConditionStaticRefine): CRIT Rate +4/5/6/7/8% → keep (real stat).
 *   - Toggle (ConditionBooleanRefine): stats are `text_percent` [120..240] only →
 *     UI display marker → drop the condition.
 *   - Toggle: Normal Attack DMG and Elemental Skill DMG +=
 *     120/150/180/210/240% of Elemental Mastery when "weapon_light_of_foliar_incision"
 *     is active (ConditionBoolean gate on the CharMultiplier).
 *
 * Modelled as:
 *   - `ConditionStaticRefine` for the always-on crit_rate passive.
 *   - `CharMultiplier`: `scaling: "mastery*"` (EM total → `mastery_total` in buildStats),
 *     `leveling: "weapon_refine"`, values [120,150,180,210,240], `target.damageTypes:
 *     ["normal","skill"]`, `condition: { type:"boolean", name:"weapon_light_of_foliar_incision" }`.
 *
 * DELIBERATELY OMITTED — ConditionBooleanRefine stats `text_percent` [120..240]:
 *   UI display markers only, not in any damage emit path → numeric no-ops.
 *
 * serializeId: 141 (raw DbObjectWeapon.serializeId).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/LightofFoliarIncision.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (scaling 'mastery*' → makeStatTotalItem('mastery'))
 */

import type {
  CharMultiplier,
  ConditionStaticRefine,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { LightofFoliarIncisionStatTable } from "../generated/weaponStatTables.js";

/**
 * A refine-indexed multiplier table. `getValue(refine)` is 1-indexed (R1 → values[0]),
 * mirroring her `ValueTable.getValue(weapon_refine)`. compileFeature divides by 100.
 */
function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

// Always-on: CRIT Rate +4/5/6/7/8% (LightofFoliarIncision.js:20-24).
const critRatePassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_light_of_foliar_incision",
  description: "talent_descr.weapon_light_of_foliar_incision_1",
  refinementStats: [
    { crit_rate: 4 }, // R1
    { crit_rate: 5 }, // R2
    { crit_rate: 6 }, // R3
    { crit_rate: 7 }, // R4
    { crit_rate: 8 }, // R5
  ],
};

// Normal Attack & Skill DMG += 120/150/180/210/240% of Elemental Mastery (LightofFoliarIncision.js:37-48).
// Gated by the "weapon_light_of_foliar_incision" boolean toggle.
const masteryToNormalSkill: CharMultiplier = {
  scaling: "mastery*",
  source: "weapon",
  leveling: "weapon_refine",
  values: refineValueTable([120, 150, 180, 210, 240]),
  condition: { type: "boolean", name: "weapon_light_of_foliar_incision" },
  target: { damageTypes: ["normal", "skill"] },
};

export const lightOfFoliarIncision: DbObjectWeapon = {
  name: "light_of_foliar_incision",
  serializeId: 141,
  gameId: 11512,
  rarity: 5,
  weapon: "sword",
  statTable: LightofFoliarIncisionStatTable,
  conditions: [critRatePassive],
  multipliers: [masteryToNormalSkill],
};
