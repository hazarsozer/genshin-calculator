/**
 * Engulfing Lightning (raw `engulfing_lightning`, module GrasscuttersLight) — 5★ Polearm
 * (NOVEL hand-port; weapon post-effect consumer).
 *
 * Passive "Timeless Dream: Eternal Stove":
 *   - ATK += 28/35/42/49/56% of Energy Recharge OVER 100% (refine-scaled), capped at +80/90/100/110/120%.
 *     A `PostEffectStatsExceedRecharge` — the reason this is a hand-port — identical in shape to the
 *     Raiden A4 fold: `bonus = max(0, recharge − 100) × ratio`, here writing `atk_percent`.
 *   - Toggle `weapon_grasscutters_light`: within 6s of using a skill, ER += 30/35/40/45/50%
 *     (a real `recharge` ConditionBooleanRefine — applied BEFORE the post-effect reads recharge).
 *
 * Our `recharge` total is a RAW PERCENT (base 100), so the exceed term is `offset: 100` and the
 * ratio is the raw percent ÷100 ([0.28…0.56]) — matching her decimal-recharge `(recharge−1)×percent`.
 * The post-effect writes `atk_percent`, which feeds `getTotal('atk')` (post-effects run in the DERIVE
 * step, before the totals are read).
 *
 * The refine-scaled cap (80/90/100/110/120% on the atk_percent output) is modelled via
 * `capValueFromTalent` (her `statCap: StatTable('', [80,90,100,110,120])` keyed off `weapon_refine`).
 * It is non-binding for the rep (Hu Tao's ER stays under the threshold) but ported faithfully.
 *
 * serializeId: 107. The `text_percent`/`text_percent_max` markers are UI-only → omitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/GrasscuttersLight.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/ExceedRecharge.js (max(0, recharge−1)×percent)
 */

import type {
  CharPostEffect,
  ConditionBooleanRefine,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { GrasscuttersLightStatTable } from "../generated/weaponStatTables.js";

function refineRatioTable(fractions: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => fractions[refine - 1] ?? 0 };
}

// Skill-active ER buff: ER += 30/35/40/45/50% (gated by the toggle). Applied in the condition
// loop, before the exceed-recharge post-effect reads the recharge total.
const erBuff: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_grasscutters_light",
  title: "talent_name.weapon_grasscutters_light",
  description: "talent_descr.weapon_grasscutters_light_2",
  refinementStats: [
    { recharge: 30 },
    { recharge: 35 },
    { recharge: 40 },
    { recharge: 45 },
    { recharge: 50 },
  ],
};

// ER-over-100 → ATK%: max(0, recharge − 100) × 0.28…0.56 (refine-scaled), writing atk_percent.
const exceedRechargeToAtk: CharPostEffect = {
  priority: 1,
  fromStat: "recharge",
  toStat: "atk_percent",
  offset: 100,
  ratioFromTalent: {
    table: refineRatioTable([0.28, 0.35, 0.42, 0.49, 0.56]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  capValueFromTalent: {
    table: refineRatioTable([80, 90, 100, 110, 120]),
    levelSetting: "weapon_refine",
  },
};

export const engulfingLightning: DbObjectWeapon = {
  name: "engulfing_lightning",
  serializeId: 107,
  gameId: 13509,
  rarity: 5,
  weapon: "polearm",
  statTable: GrasscuttersLightStatTable,
  conditions: [erBuff],
  postEffects: [exceedRechargeToAtk],
};
