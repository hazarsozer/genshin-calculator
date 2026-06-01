/**
 * Jadefall's Splendor — 5★ Catalyst (NOVEL hand-port; weapon post-effect consumer).
 *
 * "Primordial Jade Regalia": while the toggle is active, the wielder's OWN-element DMG +=
 * 0.03/0.05/0.07/0.09/0.11% of Max HP, capped at 12/20/28/36/44% (refine-scaled). A
 * `PostEffectStatsHPJadefall` whose `percent.stat` is dynamically `'dmg_' + char_element`
 * (HP → the wielder's element DMG) — the reason this is a hand-port.
 *
 * Modelled with `toStat: "dmg_own"`: buildStats's `dmg_own` fold (her CalcSet.js:380-381)
 * resolves it to `dmg_<char_element>` after post-effects — the exact dynamic-element behaviour,
 * with no per-element postEffect field. Ratio is already a fraction in raw; the refine-scaled cap
 * → `capValueFromTalent` (non-binding for the Klee rep but faithful).
 *
 * serializeId: 144. The `text_percent`/`text_percent_max` markers are UI-only → omitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/JadefallsSplendor.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/HP/Jadefall.js (percent.stat = 'dmg_' + char_element)
 */

import type { CharPostEffect, DbObjectWeapon, TalentTable } from "@genshin/types";
import { JadefallsSplendorStatTable } from "../generated/weaponStatTables.js";

function refineRatioTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

const hpToOwnDmg: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "dmg_own",
  ratioFromTalent: {
    table: refineRatioTable([0.0003, 0.0005, 0.0007, 0.0009, 0.0011]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  capValueFromTalent: {
    table: refineRatioTable([12, 20, 28, 36, 44]),
    levelSetting: "weapon_refine",
  },
  conditions: [{ type: "boolean", name: "weapon_jadefalls_splendor" }],
};

export const jadefallsSplendor: DbObjectWeapon = {
  name: "jadefalls_splendor",
  serializeId: 144,
  gameId: 14505,
  rarity: 5,
  weapon: "catalyst",
  statTable: JadefallsSplendorStatTable,
  postEffects: [hpToOwnDmg],
};
