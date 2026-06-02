/**
 * The Widsith — 4★ Catalyst (NOVEL hand-port; ConditionNot consumer).
 *
 * On equip, a random "theme" for 10s — exactly ONE of: Recitative (ATK +60/75/90/105/120%),
 * Aria (all-7 elemental DMG +48/60/72/84/96%), Interlude (EM +240/300/360/420/480). Modelled as
 * three `ConditionBooleanRefine` toggles made mutually exclusive by her `ConditionNot([ConditionOr(
 * higher themes)])` sub-gates (a theme fires only when no higher-priority theme is selected). The
 * oracle config turns all three toggles on → only the highest (Interlude/mastery) survives.
 *
 * serializeId: 50. The display `ConditionStatic` + the deferred `weapon_widsith_avg` variant are
 * omitted. Sources: raw/.../Weapon/Catalyst/Widsith.js.
 */

import type { ConditionBooleanRefine, ConditionStats, DbObjectWeapon } from "@genshin/types";
import { WidsithStatTable } from "../generated/weaponStatTables.js";

const elem = ([48, 60, 72, 84, 96] as const).map(
  (v): ConditionStats => ({ dmg_anemo: v, dmg_electro: v, dmg_pyro: v, dmg_cryo: v, dmg_hydro: v, dmg_geo: v, dmg_dendro: v })
);

// Recitative (ATK%) — only when no higher theme is selected.
const recitative: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_widsith_1",
  title: "talent_name.weapon_widsith_1",
  description: "talent_descr.weapon_widsith_1",
  refinementStats: [{ atk_percent: 60 }, { atk_percent: 75 }, { atk_percent: 90 }, { atk_percent: 105 }, { atk_percent: 120 }],
  condition: {
    type: "not",
    items: [{ type: "or", items: [
      { type: "boolean", name: "weapon_widsith_2" },
      { type: "boolean", name: "weapon_widsith_3" },
      { type: "boolean", name: "weapon_widsith_avg" },
    ] }],
  },
};

// Aria (all-7 elemental DMG%) — only when no higher theme is selected.
const aria: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_widsith_2",
  title: "talent_name.weapon_widsith_2",
  description: "talent_descr.weapon_widsith_2",
  refinementStats: elem,
  condition: {
    type: "not",
    items: [{ type: "or", items: [
      { type: "boolean", name: "weapon_widsith_3" },
      { type: "boolean", name: "weapon_widsith_avg" },
    ] }],
  },
};

// Interlude (EM) — only when the averaging variant is not selected.
const interlude: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_widsith_3",
  title: "talent_name.weapon_widsith_3",
  description: "talent_descr.weapon_widsith_3",
  refinementStats: [{ mastery: 240 }, { mastery: 300 }, { mastery: 360 }, { mastery: 420 }, { mastery: 480 }],
  condition: { type: "not", items: [{ type: "boolean", name: "weapon_widsith_avg" }] },
};

export const theWidsith: DbObjectWeapon = {
  name: "the_widsith",
  serializeId: 50,
  gameId: 14402,
  rarity: 4,
  weapon: "catalyst",
  statTable: WidsithStatTable,
  conditions: [recitative, aria, interlude],
};
