/**
 * Flowing Purity — 4★ Catalyst (NOVEL hand-port).
 *
 * - Toggle `weapon_flowing_purity_1`: all 7 elemental DMG +8/10/12/14/16% (ConditionBooleanRefine) —
 *   ACTIVE in the oracle. (Only the wielder's own element binds on their direct hits; the rest are
 *   inert for the rep, but ported faithfully.)
 * - A `PostEffectStatsBondOfLife` (raw FlowingPurity.js:15-31): each of the 7 elemental DMG bonuses
 *   gains `min(ratio[R] × hp_total × (settings[weapon_flowing_purity_bol] / 100), cap[R])`, ratio
 *   [.002,.0025,.003,.0035,.004], cap [12,15,18,21,24], gated by a truthy `weapon_flowing_purity_bol`
 *   (her `ConditionBoolean({name:'weapon_flowing_purity_bol'})` — active iff the BoL setting is > 0).
 *   `dmg_<el>` IS a percent key (DMG_BONUS_ELEMENT_KEYS) → buildStats folds the emitted value AND its
 *   cap /100 (the Clorinde-C4 / Neuvillette-A4 `dmg_*` idiom), so the post-effect carries ratio + cap
 *   RAW and writes `min(ratio×hp×BoL/100, cap)` RAW; the single emit /100 yields the human-% fraction.
 *   The `settings[weapon_flowing_purity_bol] / 100` factor is the new `fromStatFactorSetting` branch
 *   (mirrors her `getBolValue = (settings[bolSettingName]||0)/100`, BondOfLife.js:6-8).
 *
 * serializeId: 154. The `ConditionNumberLevels` BoL input + its `text_*` markers are UI-only → omitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/FlowingPurity.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/BondOfLife.js
 */

import type {
  CharPostEffect,
  ConditionBoolean,
  ConditionBooleanRefine,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { FlowingPurityStatTable } from "../generated/weaponStatTables.js";
import { BOND_OF_LIFE_INPUT } from "../characterConditions.js";

function refineTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

const elementBuff: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_flowing_purity_1",
  title: "talent_name.weapon_flowing_purity",
  description: "talent_descr.weapon_flowing_purity_1",
  refinementStats: ([8, 10, 12, 14, 16] as const).map((v) => ({
    dmg_anemo: v, dmg_geo: v, dmg_pyro: v, dmg_electro: v, dmg_hydro: v, dmg_cryo: v, dmg_dendro: v,
  })),
};

// Active iff the BoL setting is truthy (>0) — her ConditionBoolean({name:'weapon_flowing_purity_bol'}).
const bolGate: ConditionBoolean = {
  type: "boolean",
  name: "weapon_flowing_purity_bol",
};

// Her `percent` is a 7-StatTable array (one per element), all sharing the same ratio table; the
// `statCap` ('', [12..24]) applies to each. One CharPostEffect per element — each lifts that element's
// DMG by `min(ratio × hp_total × BoL/100, cap)` (RAW; the dmg_<el> emit folds value+cap /100).
const ELEMENTS = ["anemo", "geo", "pyro", "electro", "hydro", "cryo", "dendro"] as const;
const ratioTable = refineTable([0.002, 0.0025, 0.003, 0.0035, 0.004]);
const capTable = refineTable([12, 15, 18, 21, 24]);

const bolPostEffects: readonly CharPostEffect[] = ELEMENTS.map((el) => ({
  priority: 1,
  fromStat: "hp",
  fromStatFactorSetting: "weapon_flowing_purity_bol",
  toStat: `dmg_${el}`,
  ratioFromTalent: { table: ratioTable, levelSetting: "weapon_refine", multi: 1 },
  capValueFromTalent: { table: capTable, levelSetting: "weapon_refine" },
  conditions: [bolGate],
}));

export const flowingPurity: DbObjectWeapon = {
  name: "flowing_purity",
  serializeId: 154,
  gameId: 14425,
  rarity: 4,
  weapon: "catalyst",
  statTable: FlowingPurityStatTable,
  conditions: [elementBuff, BOND_OF_LIFE_INPUT],
  postEffects: bolPostEffects,
};
