/**
 * Finale of the Deep — 4★ Sword (NOVEL hand-port).
 *
 * - Toggle `weapon_finale_of_the_deep_1`: ATK +12/15/18/21/24% (ConditionBooleanRefine) — ACTIVE
 *   in the oracle (toggle on).
 * - A `PostEffectStatsBondOfLife` (raw FinaleOfTheDeep.js:11-19): ATK +=
 *   `min(ratio[R] × hp_total × (settings[weapon_finale_of_the_deep_bol] / 100), cap[R])`, ratio
 *   [.024,.03,.036,.042,.048], cap [150,187.5,225,262.5,300], gated by a truthy
 *   `weapon_finale_of_the_deep_bol` (her `ConditionBoolean({name:'weapon_finale_of_the_deep_bol'})` —
 *   active iff the BoL setting is > 0). `atk` is NOT a percent key (isPercent('atk') is false) → no
 *   fold: ratio and cap are RAW flat-ATK, the bonus lands in `atk` directly (read via getTotal('atk'),
 *   lifting ALL the wielder's ATK-scaling damage). The `settings[…_bol] / 100` factor is the new
 *   `fromStatFactorSetting` branch (mirrors her `getBolValue = (settings[bolSettingName]||0)/100`,
 *   BondOfLife.js:6-8).
 *
 * serializeId: 147. The `ConditionNumberLevels` BoL input + its `text_*` stats are UI-only → omitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/FinaleOfTheDeep.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/BondOfLife.js
 */

import type {
  CharPostEffect,
  ConditionBoolean,
  ConditionBooleanRefine,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { FinaleOfTheDeepStatTable } from "../generated/weaponStatTables.js";
import { BOND_OF_LIFE_INPUT } from "../characterConditions.js";

function refineTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

const atkBuff: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_finale_of_the_deep_1",
  title: "talent_name.weapon_finale_of_the_deep",
  description: "talent_descr.weapon_finale_of_the_deep_1",
  refinementStats: [{ atk_percent: 12 }, { atk_percent: 15 }, { atk_percent: 18 }, { atk_percent: 21 }, { atk_percent: 24 }],
};

// Active iff the BoL setting is truthy (>0) — her ConditionBoolean({name:'weapon_finale_of_the_deep_bol'}).
const bolGate: ConditionBoolean = {
  type: "boolean",
  name: "weapon_finale_of_the_deep_bol",
};

// Flat-ATK BoL fold: atk += min(ratio × hp_total × BoL/100, cap). atk is non-percent → RAW ratio + cap.
const bolPostEffect: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  fromStatFactorSetting: "weapon_finale_of_the_deep_bol",
  toStat: "atk",
  ratioFromTalent: {
    table: refineTable([0.024, 0.03, 0.036, 0.042, 0.048]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  capValueFromTalent: {
    table: refineTable([150, 187.5, 225, 262.5, 300]),
    levelSetting: "weapon_refine",
  },
  conditions: [bolGate],
};

export const finaleOfTheDeep: DbObjectWeapon = {
  name: "finale_of_the_deep",
  serializeId: 147,
  gameId: 11425,
  rarity: 4,
  weapon: "sword",
  statTable: FinaleOfTheDeepStatTable,
  conditions: [atkBuff, BOND_OF_LIFE_INPUT],
  postEffects: [bolPostEffect],
};
