/**
 * Staff of Homa — 5★ Polearm (NOVEL hand-port; weapon post-effect consumer).
 *
 * Passive "Reckless Cinnabar":
 *   - Always-on: HP +20/25/30/35/40% (ConditionStaticRefine, refine-scaled).
 *   - HP→ATK fold (the post-effect, the reason this is a hand-port):
 *       ATK += 0.8/1.0/1.2/1.4/1.6% of Max HP (always-on base), PLUS
 *       ATK += 1.0/1.2/1.4/1.6/1.8% of Max HP WHEN HP < 50% (the toggle
 *       `weapon_staff_of_homa`). Both terms read the HP TOTAL (incl. the +20-40%
 *       hp_percent above, applied first in buildStats's condition loop).
 *
 * Faithful to her PostEffectStatsHP (getBaseValueTree → makeStatTotalItem('hp');
 * getTree folds base + percentBonus before × HP):
 *   raw/.../db/Weapon/Polearm/StaffofHoma.js:10-16 (weaponPost):
 *     percent          = StatTable('atk', [0.008, 0.01, 0.012, 0.014, 0.016])  // base ratio per refine
 *     percentBonus     = StatTable('atk', [0.01,  0.012,0.014, 0.016, 0.018])  // +HP<50% ratio per refine
 *     bonusCondition   = ConditionBoolean({name: 'weapon_staff_of_homa'})
 *   Her getTree does `valueConst = CSum([base, bonus])` (Stats.js:83-88) when the
 *   bonus condition is active, then × HP. We model the SUM as two additive
 *   post-effects (post-effects accumulate): the always-on base fold + the toggle-
 *   gated bonus fold. At R1 toggle-ON: (0.008 + 0.01)×HP; R5: (0.016 + 0.018)×HP.
 *
 * The ratio is REFINE-scaled, not talent-scaled: `ratioFromTalent` keys its table
 * off `weapon_refine` (her `levelSetting: 'weapon_refine'` → PostEffect.getLevel →
 * `settings.weapon_refine`), with `getValue(refine)` returning the per-refine ratio
 * (already a fraction → `multi: 1`). The R1/R5 burndown fixtures pin both ends.
 *
 * No `cap` — Homa's HP→ATK has no statCap (unlike Hu Tao's Paramita fold).
 *
 * serializeId: 80 (raw DbObjectWeapon.serializeId). Feature (atk_bonus display) is
 * a UI tracker, out of scope (stat-only port).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/StaffofHoma.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/HP.js (getBaseValueTree → makeStatTotalItem('hp'))
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats.js:39-101 (getTree: base + percentBonus, × HP)
 *   raw/genshin_calc_pub/src/js/classes/PostEffect.js:45-55 (getLevel reads levelSetting from settings)
 */

import type {
  CharPostEffect,
  ConditionStaticRefine,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { StaffofHomaStatTable } from "../generated/weaponStatTables.js";

/**
 * A refine-indexed ratio table for `ratioFromTalent`. `getValue(refine)` is
 * 1-indexed (R1 → fractions[0]), mirroring her `StatTable.getValue(weapon_refine)`.
 */
function refineRatioTable(fractions: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => fractions[refine - 1] ?? 0 };
}

// Always-on base HP→ATK (StaffofHoma.js:11 `percent`).
const hpToAtkBase: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "atk",
  ratioFromTalent: {
    table: refineRatioTable([0.008, 0.01, 0.012, 0.014, 0.016]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
};

// HP<50% bonus HP→ATK (StaffofHoma.js:13-15 `percentBonus` + `bonusCondition`).
const hpToAtkBonus: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "atk",
  ratioFromTalent: {
    table: refineRatioTable([0.01, 0.012, 0.014, 0.016, 0.018]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  conditions: [{ type: "boolean", name: "weapon_staff_of_homa" }],
};

// Always-on HP +20/25/30/35/40% (StaffofHoma.js:41-48; the `text_percent` markers
// are UI-only — not in any buildStats emit list → numeric no-ops, omitted).
const hpPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_staff_of_homa",
  description: "talent_descr.weapon_staff_of_homa_passive",
  refinementStats: [
    { hp_percent: 20 }, // R1
    { hp_percent: 25 }, // R2
    { hp_percent: 30 }, // R3
    { hp_percent: 35 }, // R4
    { hp_percent: 40 }, // R5
  ],
};

export const staffOfHoma: DbObjectWeapon = {
  name: "staff_of_homa",
  serializeId: 80,
  gameId: 13501,
  rarity: 5,
  weapon: "polearm",
  statTable: StaffofHomaStatTable,
  conditions: [hpPassive],
  postEffects: [hpToAtkBase, hpToAtkBonus],
};
