/**
 * Makhaira Aquamarine — 4★ Claymore (NOVEL hand-port; weapon post-effect consumer).
 *
 * Passive "Desert Pavilion": while the toggle `weapon_desert_pavilion` is active, ATK is
 * increased by 24/30/36/42/48% of Elemental Mastery (refine-scaled). A `PostEffectStatsMastery`
 * (EM→ATK fold) — the reason this is a hand-port. (Her off-field 30% variant `atk_bonus_bonus`
 * is a UI display feature, out of scope.)
 *
 * Faithful to MakhairaAquamarine.js: `PostEffectStatsMastery({ levelSetting:'weapon_refine',
 * percent: StatTable('atk',[0.24,0.30,0.36,0.42,0.48]), conditions:[Boolean weapon_desert_pavilion] })`
 * → CharPostEffect fromStat "mastery" → toStat "atk" (flat), ratio refine-indexed (already a
 * fraction → multi 1), gated by the toggle. The `text_percent` ConditionBooleanRefine is a UI
 * marker (no stat key) → omitted.
 *
 * serializeId: 136.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Claymore/MakhairaAquamarine.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Mastery.js (mastery → toStat)
 */

import type { CharPostEffect, DbObjectWeapon, TalentTable } from "@genshin/types";
import { MakhairaAquamarineStatTable } from "../generated/weaponStatTables.js";

/** Refine-indexed ratio table (1-indexed; R1 → fractions[0]). */
function refineRatioTable(fractions: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => fractions[refine - 1] ?? 0 };
}

// EM→ATK: ATK += 24/30/36/42/48% of Mastery, gated by the Desert Pavilion toggle.
const emToAtk: CharPostEffect = {
  priority: 1,
  fromStat: "mastery",
  toStat: "atk",
  ratioFromTalent: {
    table: refineRatioTable([0.24, 0.3, 0.36, 0.42, 0.48]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  conditions: [{ type: "boolean", name: "weapon_desert_pavilion" }],
};

export const makhairaAquamarine: DbObjectWeapon = {
  name: "makhaira_aquamarine",
  serializeId: 136,
  gameId: 12415,
  rarity: 4,
  weapon: "claymore",
  statTable: MakhairaAquamarineStatTable,
  postEffects: [emToAtk],
};
