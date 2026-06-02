/**
 * Mistsplitter Reforged — 5★ Sword (NOVEL hand-port; ConditionDropdown consumer).
 *
 * - Always-on: all 7 elemental DMG +12/15/18/21/24% (ConditionStaticRefine).
 * - "Mistsplitter's Emblem" — a 3-level dropdown (`weapon_mistsplitters_reforged`): each tier
 *   grants `dmg_own` (the wielder's OWN-element DMG; buildStats folds it into `dmg_<char_element>`
 *   per her CalcSet.js:380-381). Tiers: 8/16/28% at R1 (16/20/24/28/.. scaling per refine).
 *
 * serializeId: 101. The oracle selects tier 3 (`weapon_mistsplitters_reforged: 3`).
 * Sources: raw/.../Weapon/Sword/MistsplitterReforged.js:28-88; raw/.../classes/CalcSet.js:380-381.
 */

import type { ConditionDropdown, ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { MistsplitterReforgedStatTable } from "../generated/weaponStatTables.js";

const allElement: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_mistsplitters_reforged",
  description: "talent_descr.weapon_mistsplitters_reforged_1",
  refinementStats: ([12, 15, 18, 21, 24] as const).map((v) => ({
    dmg_anemo: v, dmg_geo: v, dmg_pyro: v, dmg_electro: v, dmg_hydro: v, dmg_cryo: v, dmg_dendro: v,
  })),
};

const emblem: ConditionDropdown = {
  type: "dropdown",
  name: "weapon_mistsplitters_reforged",
  options: [
    [{ dmg_own: 8 }, { dmg_own: 10 }, { dmg_own: 12 }, { dmg_own: 14 }, { dmg_own: 16 }],
    [{ dmg_own: 16 }, { dmg_own: 20 }, { dmg_own: 24 }, { dmg_own: 28 }, { dmg_own: 32 }],
    [{ dmg_own: 28 }, { dmg_own: 35 }, { dmg_own: 42 }, { dmg_own: 49 }, { dmg_own: 56 }],
  ],
};

export const mistsplitterReforged: DbObjectWeapon = {
  name: "mistsplitter_reforged",
  serializeId: 101,
  gameId: 11509,
  rarity: 5,
  weapon: "sword",
  statTable: MistsplitterReforgedStatTable,
  conditions: [allElement, emblem],
};
