/**
 * Primordial Jade Cutter — 5★ Sword (NOVEL hand-port; weapon post-effect consumer).
 *
 * Passive "Protector's Virtue":
 *   - Always-on: HP +20/25/30/35/40% (ConditionStaticRefine, refine-scaled).
 *   - HP→ATK fold: ATK += 1.2/1.5/1.8/2.1/2.4% of Max HP (always-on, NO toggle —
 *     unlike Staff of Homa's HP<50% bonus term). Reads the HP TOTAL (incl. the
 *     +20-40% hp_percent above, applied first in buildStats's condition loop).
 *
 * The "crit" half of this weapon is its SECONDARY STAT (CRIT Rate, already in the
 * generated statTable as `crit_rate_base: 9.6`) — there is NO crit post-effect.
 * Only the HP→ATK fold is a post-effect.
 *
 * Faithful to her PostEffectStatsHP (getBaseValueTree → makeStatTotalItem('hp')):
 *   raw/.../db/Weapon/Sword/PrimordialJadeCutter.js:8-11 (atkBuff):
 *     percent       = StatTable('atk', [0.012, 0.015, 0.018, 0.021, 0.024])  // per refine
 *     levelSetting  = 'weapon_refine'
 *   No `percentBonus`, no `bonusCondition`, no `statCap` → a single always-on fold.
 *
 * The ratio is REFINE-scaled: `ratioFromTalent` keys its table off `weapon_refine`
 * (`getValue(refine)` returns the per-refine fraction → `multi: 1`). The R1/R5
 * burndown fixtures pin both ends.
 *
 * serializeId: 14 (raw DbObjectWeapon.serializeId). Feature (atk_bonus display) is
 * a UI tracker, out of scope (stat-only port). `text_percent` markers are UI-only
 * (not in any buildStats emit list → numeric no-ops, omitted).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/PrimordialJadeCutter.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/HP.js (getBaseValueTree → makeStatTotalItem('hp'))
 *   raw/genshin_calc_pub/src/js/classes/PostEffect.js:45-55 (getLevel reads levelSetting from settings)
 */

import type {
  CharPostEffect,
  ConditionStaticRefine,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { PrimordialJadeCutterStatTable } from "../generated/weaponStatTables.js";

/**
 * A refine-indexed ratio table for `ratioFromTalent`. `getValue(refine)` is
 * 1-indexed (R1 → fractions[0]), mirroring her `StatTable.getValue(weapon_refine)`.
 */
function refineRatioTable(fractions: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => fractions[refine - 1] ?? 0 };
}

// Always-on HP→ATK (PrimordialJadeCutter.js:8-11 `atkBuff`).
const hpToAtk: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "atk",
  ratioFromTalent: {
    table: refineRatioTable([0.012, 0.015, 0.018, 0.021, 0.024]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
};

// Always-on HP +20/25/30/35/40% (PrimordialJadeCutter.js:21-29).
const hpPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_primordial_jade_cutter",
  description: "talent_descr.weapon_primordial_jade_cutter",
  refinementStats: [
    { hp_percent: 20 }, // R1
    { hp_percent: 25 }, // R2
    { hp_percent: 30 }, // R3
    { hp_percent: 35 }, // R4
    { hp_percent: 40 }, // R5
  ],
};

export const primordialJadeCutter: DbObjectWeapon = {
  name: "primordial_jade_cutter",
  serializeId: 14,
  gameId: 11505,
  rarity: 5,
  weapon: "sword",
  statTable: PrimordialJadeCutterStatTable,
  conditions: [hpPassive],
  postEffects: [hpToAtk],
};
