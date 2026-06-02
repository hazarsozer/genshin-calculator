/**
 * everlasting_moonglow — 5★ Catalyst (NOVEL hand-port; weapon FeatureMultiplier consumer).
 *
 * Passive "Byakuya Koukai":
 *   - Always-on (ConditionStaticRefine): healing +10/12.5/15/17.5/20% and
 *     normal_base_hp_percent +1/1.5/2/2.5/3%. Both keys are no-ops for damage:
 *     `healing` is not in any buildStats emit list; `normal_base_hp_percent` is DEAD
 *     in the damage path (getBaseBonus never called by getTree). Drop the whole condition.
 *   - Always-on (ConditionStatic): UI-only title/description with no stats → drop.
 *   - Always-on: Normal Attack DMG += 1/1.5/2/2.5/3% of Max HP.
 *     Modelled as a `CharMultiplier`: `scaling: "hp*"` (HP total), `leveling:
 *     "weapon_refine"` with table [1,1.5,2,2.5,3], `target.damageTypes: ["normal"]`.
 *     No condition (always-on).
 *
 * DELIBERATELY OMITTED — ConditionStaticRefine (healing + normal_base_hp_percent):
 *   `healing` is not emitted by buildStats.
 *   `normal_base_hp_percent` feeds getBaseBonus (Stats.js:54-57) which is never called
 *   by FeatureDamage.getTree → dead in the damage path.
 *   The CharMultiplier `hp*` entry is the sole damage-relevant contribution.
 *
 * DELIBERATELY OMITTED — ConditionStatic (no stats, UI-only).
 *
 * serializeId: 108 (raw DbObjectWeapon.serializeId).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/EverlastingMoonglow.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (scaling 'hp*' → makeStatTotalItem('hp'))
 */

import type {
  CharMultiplier,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { EverlastingMoonglowStatTable } from "../generated/weaponStatTables.js";

/**
 * A refine-indexed multiplier table. `getValue(refine)` is 1-indexed (R1 → values[0]),
 * mirroring her `ValueTable.getValue(weapon_refine)`. compileFeature divides by 100.
 */
function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

// Normal Attack DMG += 1/1.5/2/2.5/3% of Max HP (EverlastingMoonglow.js:33-41).
// Always-on (no condition). Scales with HP total.
const hpToNormal: CharMultiplier = {
  scaling: "hp*",
  source: "weapon",
  leveling: "weapon_refine",
  values: refineValueTable([1, 1.5, 2, 2.5, 3]),
  target: { damageTypes: ["normal"] },
};

export const everlastingMoonglow: DbObjectWeapon = {
  name: "everlasting_moonglow",
  serializeId: 108,
  gameId: 14506,
  rarity: 5,
  weapon: "catalyst",
  statTable: EverlastingMoonglowStatTable,
  multipliers: [hpToNormal],
};
