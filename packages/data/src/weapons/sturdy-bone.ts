/**
 * sturdy_bone — 4★ Sword (NOVEL hand-port; weapon FeatureMultiplier consumer).
 *
 * Passive "Bone Fracture":
 *   - Toggle (ConditionBooleanRefine): stats are `text_percent_dmg` [16..32] only →
 *     UI display marker, not in any buildStats emit list → drop the condition.
 *   - Toggle: Normal Attack DMG += 16/20/24/28/32% of ATK when
 *     "weapon_sturdy_bone" is active.
 *     Raw `FeatureMultiplier` has NO `scaling` field → defaults to `'atk*'`
 *     (raw Multiplier.js:23: `this.scaling = data.scaling || 'atk*'`).
 *     Modelled as a `CharMultiplier` with `scaling: "atk*"` (ATK total),
 *     `leveling: "weapon_refine"`, values [16,20,24,28,32],
 *     `target.damageTypes: ["normal"]`,
 *     `condition: { type:"boolean", name:"weapon_sturdy_bone" }` (toggle gate).
 *
 * DELIBERATELY OMITTED — ConditionBooleanRefine stats `text_percent_dmg` [16..32]:
 *   UI display markers only, not in any damage emit path → numeric no-ops.
 *
 * serializeId: 186 (raw DbObjectWeapon.serializeId).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/SturdyBone.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (no scaling → default 'atk*')
 */

import type {
  CharMultiplier,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { SturdyBoneStatTable } from "../generated/weaponStatTables.js";

/**
 * A refine-indexed multiplier table. `getValue(refine)` is 1-indexed (R1 → values[0]),
 * mirroring her `ValueTable.getValue(weapon_refine)`. compileFeature divides by 100.
 */
function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

// Normal Attack DMG += 16/20/24/28/32% of ATK (SturdyBone.js:29-39).
// Raw FeatureMultiplier has no `scaling` field → defaults to 'atk*'.
// Gated by the "weapon_sturdy_bone" boolean toggle.
const atkToNormal: CharMultiplier = {
  scaling: "atk*",
  source: "weapon",
  leveling: "weapon_refine",
  values: refineValueTable([16, 20, 24, 28, 32]),
  condition: { type: "boolean", name: "weapon_sturdy_bone" },
  target: { damageTypes: ["normal"] },
};

export const sturdyBone: DbObjectWeapon = {
  name: "sturdy_bone",
  serializeId: 186,
  gameId: 11430,
  rarity: 4,
  weapon: "sword",
  statTable: SturdyBoneStatTable,
  multipliers: [atkToNormal],
};
