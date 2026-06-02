/**
 * freedom_sworn — 5★ Sword. BIND.
 *
 * Passive "Revolutionary Chorale":
 *   - Always-on (ConditionStaticRefine): DMG +10/12.5/15/17.5/20% at R1..R5.
 *   - Toggle (ConditionBooleanRefine, "weapon_freedom_sworn"): stats are
 *     `text_percent` [20..40] and `text_percent_2` [16..32] only → UI display
 *     markers (not in any buildStats emit list) → OMITTED.
 *     The team buff entry in Buffs/Weapons.js is likewise INERT in solo → OMITTED.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/FreedomSworn.js
 */

import type { DbObjectWeapon } from "@genshin/types";
import { FreedomSwornStatTable } from "../generated/weaponStatTables.js";

export const freedomSworn: DbObjectWeapon = {
  name: "freedom_sworn",
  serializeId: 97,
  gameId: 11503,
  rarity: 5,
  weapon: "sword",
  statTable: FreedomSwornStatTable,
  conditions: [
    // Always-on DMG +10/12.5/15/17.5/20% (FreedomSworn.js:15-19).
    {
      type: "refine",
      title: "talent_name.weapon_freedom_sworn_passive",
      description: "talent_descr.weapon_freedom_sworn_passive",
      refinementStats: [
        { dmg_all: 10 },   // R1
        { dmg_all: 12.5 }, // R2
        { dmg_all: 15 },   // R3
        { dmg_all: 17.5 }, // R4
        { dmg_all: 20 },   // R5
      ],
    },
    // ConditionBooleanRefine toggle ("weapon_freedom_sworn") carries only
    // text_percent/text_percent_2 → display-only → OMITTED.
  ],
};
