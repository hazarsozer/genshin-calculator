/**
 * Redhorn Stonethresher — 5★ Claymore (NOVEL hand-port; weapon FeatureMultiplier consumer).
 *
 * Passive "Gokadaiou Otogibanashi":
 *   - Always-on: DEF +28/35/42/49/56% (ConditionStaticRefine, base-stat path).
 *   - Always-on: Normal & Charged Attack DMG increased by 40/50/60/70/80% of DEF.
 *     This is the reason this is a hand-port: a `FeatureMultiplier` the WEAPON
 *     contributes that scales DEF into the WIELDER's normal/charged hits (her
 *     `multipliers: [FeatureMultiplier({ scaling:'def*', target:[normal,charged] })]`)
 *     — a char-level ("targeted") multiplier the stat-only wrapper can't express.
 *
 * Modelled as a single `CharMultiplier`: `scaling: "def*"` (DEF TOTAL — her `'def*'`
 * means makeStatTotalItem), `leveling: "weapon_refine"` with a refine-indexed table
 * [40,50,60,70,80] (compileFeature reads `settings.weapon_refine` and divides by 100),
 * `target.damageTypes: ["normal","charged"]`. The armory harness threads `weapon.multipliers`
 * into `compileCharacter`'s `extraMultipliers`, where it merges into the active char-level
 * multiplier list and injects into every matching normal/charged feature's base term —
 * exactly as Itto's own A4 def→charged multiplier does (they stack additively).
 *
 * DELIBERATELY OMITTED — `normal_base_def_percent` / `charged_base_def_percent` (raw
 * conditions, RedhornStonethresher.js:23-24): these feed her `Stats.getBaseBonus`
 * (Stats.js:54-57), but `FeatureDamage.getTree` (Damage.js:270-302) NEVER calls
 * `getBaseBonus` — its base damage is ONLY `CBaseDamage(multipliers.map(...))`. So those
 * keys are DEAD in the damage path (a legacy/redundant representation of the same 40%);
 * the `multipliers` `def*` entry is the sole damage-relevant contribution. Verified exact
 * vs the R1 fixture with the def* multiplier ALONE (Itto rep: normal_hit_1 2001.2,
 * saichimonji 2820.3, skill_dmg 6356.5 unaffected). Adding the base_def_percent keys
 * would DOUBLE-count.
 *
 * serializeId: 117 (raw DbObjectWeapon.serializeId).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Claymore/RedhornStonethresher.js:9-39
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (scaling 'def*' → makeStatTotalItem('def'))
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage.js:270-302 (getTree — no getBaseBonus call)
 *   raw/genshin_calc_pub/src/js/classes/Stats.js:46-70 (getBaseBonus — defined, unused by getTree)
 */

import type {
  CharMultiplier,
  ConditionStaticRefine,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { RedhornStonethresherStatTable } from "../generated/weaponStatTables.js";

/**
 * A refine-indexed multiplier table. `getValue(refine)` is 1-indexed (R1 → values[0]),
 * mirroring her `ValueTable.getValue(weapon_refine)`. compileFeature divides by 100.
 */
function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

// Always-on DEF +28/35/42/49/56% (RedhornStonethresher.js:18-26, `def_percent`).
const defPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_redhorn_stonethresher",
  description: "talent_descr.weapon_redhorn_stonethresher",
  refinementStats: [
    { def_percent: 28 }, // R1
    { def_percent: 35 }, // R2
    { def_percent: 42 }, // R3
    { def_percent: 49 }, // R4
    { def_percent: 56 }, // R5
  ],
};

// Normal & Charged DMG += 40/50/60/70/80% of DEF (RedhornStonethresher.js:28-38).
// A char-level targeted multiplier; refine-leveled; scales the DEF total.
const defToNormalCharged: CharMultiplier = {
  scaling: "def*",
  source: "weapon",
  leveling: "weapon_refine",
  values: refineValueTable([40, 50, 60, 70, 80]),
  target: { damageTypes: ["normal", "charged"] },
};

export const redhornStonethresher: DbObjectWeapon = {
  name: "redhorn_stonethresher",
  serializeId: 117,
  gameId: 12510,
  rarity: 5,
  weapon: "claymore",
  statTable: RedhornStonethresherStatTable,
  conditions: [defPassive],
  multipliers: [defToNormalCharged],
};
