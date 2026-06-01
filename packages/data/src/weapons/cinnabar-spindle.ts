/**
 * cinnabar_spindle — 4★ Sword (NOVEL hand-port; weapon FeatureMultiplier consumer).
 *
 * Passive "Spotless Heart":
 *   - Toggle (ConditionBooleanRefine): stats are `text_percent` [40..80] only →
 *     UI display marker, not in any buildStats emit list → drop the condition.
 *   - Toggle: Elemental Skill DMG += 40/50/60/70/80% of DEF when
 *     "weapon_cinnabar_spindle" is active.
 *     Modelled as a `CharMultiplier`: `scaling: "def*"` (DEF total), `leveling:
 *     "weapon_refine"` with table [40,50,60,70,80], `target.damageTypes: ["skill"]`,
 *     `condition: { type:"boolean", name:"weapon_cinnabar_spindle" }` (toggle gate).
 *
 * DELIBERATELY OMITTED — ConditionBooleanRefine stats `text_percent` [40..80]:
 *   UI display markers only, not in any damage emit path → numeric no-ops.
 *   The CharMultiplier `def*` entry is the sole damage-relevant contribution.
 *
 * serializeId: 116 (raw DbObjectWeapon.serializeId).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/CinnabarSpindle.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (scaling 'def*' → makeStatTotalItem('def'))
 */

import type {
  CharMultiplier,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { CinnabarSpindleStatTable } from "../generated/weaponStatTables.js";

/**
 * A refine-indexed multiplier table. `getValue(refine)` is 1-indexed (R1 → values[0]),
 * mirroring her `ValueTable.getValue(weapon_refine)`. compileFeature divides by 100.
 */
function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

// Elemental Skill DMG += 40/50/60/70/80% of DEF (CinnabarSpindle.js:29-40).
// Gated by the "weapon_cinnabar_spindle" boolean toggle.
const defToSkill: CharMultiplier = {
  scaling: "def*",
  source: "weapon",
  leveling: "weapon_refine",
  values: refineValueTable([40, 50, 60, 70, 80]),
  condition: { type: "boolean", name: "weapon_cinnabar_spindle" },
  target: { damageTypes: ["skill"] },
};

export const cinnabarSpindle: DbObjectWeapon = {
  name: "cinnabar_spindle",
  serializeId: 116,
  gameId: 11415,
  rarity: 4,
  weapon: "sword",
  statTable: CinnabarSpindleStatTable,
  multipliers: [defToSkill],
};
