/**
 * Slingshot — 3★ Bow (NOVEL hand-port).
 *
 * Her `DbObjectWeapon.refineTable` (an UNCONDITIONAL base modifier) applies Normal/Charged DMG −10%
 * always (the long-range penalty, modelled in the calc as always-on). Plus a toggle
 * `weapon_slingshot`: at close range, Normal & Charged DMG +46/52/58/64/70%. Net at R1 with the
 * toggle on = +36% (the `text_percent` display).
 *
 * The `refineTable` has no field on our `DbObjectWeapon`; modelled as an always-on `ConditionStatic`
 * (dmg_normal/dmg_charged −10). serializeId: 38. Sources: raw/.../Weapon/Bow/Slingshot.js.
 */

import type { ConditionBooleanRefine, ConditionStatic, DbObjectWeapon } from "@genshin/types";
import { SlingshotStatTable } from "../generated/weaponStatTables.js";

// Unconditional −10% Normal/Charged (her refineTable, always applied).
const longRangePenalty: ConditionStatic = {
  type: "static",
  title: "talent_name.weapon_slingshot",
  stats: { dmg_normal: -10, dmg_charged: -10 },
};

// Close-range toggle: Normal & Charged DMG +46..70%.
const closeRange: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_slingshot",
  title: "talent_name.weapon_slingshot",
  description: "talent_descr.weapon_slingshot",
  refinementStats: [
    { dmg_normal: 46, dmg_charged: 46 },
    { dmg_normal: 52, dmg_charged: 52 },
    { dmg_normal: 58, dmg_charged: 58 },
    { dmg_normal: 64, dmg_charged: 64 },
    { dmg_normal: 70, dmg_charged: 70 },
  ],
};

export const slingshot: DbObjectWeapon = {
  name: "slingshot",
  serializeId: 38,
  gameId: 15304,
  rarity: 3,
  weapon: "bow",
  statTable: SlingshotStatTable,
  conditions: [longRangePenalty, closeRange],
};
